"""Prepare bounded Web Audio chunks from the approved recordings. Requires ffmpeg/numpy."""
import hashlib
import json
import pathlib
import subprocess
import tempfile
import wave
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[2]
ASSETS = ROOT / 'public/assets/music'
RATE, CHANNELS, SECONDS = 44100, 2, 6

def decode(path):
    return subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 's16le', '-ar', str(RATE), '-ac', str(CHANNELS), '-'])

def main():
    catalog = json.loads((ASSETS / 'manifest.json').read_text())
    pack, tracks, measurements = bytearray(), {}, {}
    with tempfile.TemporaryDirectory() as tmp:
        for track in catalog['tracks']:
            original = ASSETS / track['file']
            assert hashlib.sha256(original.read_bytes()).hexdigest() == track['sha256']
            pcm = decode(original)
            chunks, restored = [], bytearray()
            for offset in range(0, len(pcm), RATE * CHANNELS * 2 * SECONDS):
                part = pcm[offset:offset + RATE * CHANNELS * 2 * SECONDS]
                wav, mp3 = pathlib.Path(tmp) / 'chunk.wav', pathlib.Path(tmp) / 'chunk.mp3'
                with wave.open(str(wav), 'wb') as out:
                    out.setparams((CHANNELS, 2, RATE, 0, 'NONE', 'not compressed'))
                    out.writeframes(part)
                # Compensate LAME's measured 0.95 encode gain at 128 kbps; assert the decoded
                # RMS below so toolchain changes cannot silently change loudness.
                subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(wav), '-af', 'volume=1.052631579', '-codec:a', 'libmp3lame', '-b:a', '128k', '-map_metadata', '-1', str(mp3)], check=True)
                encoded = mp3.read_bytes()
                decoded = decode(mp3)
                assert len(decoded) == len(part), 'gapless sample count must survive encoding'
                restored.extend(decoded)
                chunks.append(dict(start=offset / (RATE * CHANNELS * 2), duration=len(part) / (RATE * CHANNELS * 2), offset=len(pack), bytes=len(encoded), sha256=hashlib.sha256(encoded).hexdigest()))
                pack.extend(encoded)
            a = np.frombuffer(pcm, '<i2').astype(float)
            b = np.frombuffer(restored, '<i2').astype(float)
            snr = float(10 * np.log10(np.mean(a*a) / max(1e-10, np.mean((a-b)**2))))
            measurements[track['id']] = dict(samples=len(a)//CHANNELS, chunks=len(chunks), snrDb=snr, rmsChangeDb=float(10*np.log10(np.mean(b*b)/np.mean(a*a))))
            assert snr > 30, 'avoid an audible generation-loss regression'
            assert abs(measurements[track['id']]['rmsChangeDb']) < .05
            tracks[track['id']] = chunks
    (ASSETS / 'game-music.bin').write_bytes(pack)
    index = dict(version=1, file='game-music.bin', sampleRate=RATE, channels=CHANNELS, chunkSeconds=SECONDS, codec='MP3 128 kbps, gapless chunks', bytes=len(pack), sha256=hashlib.sha256(pack).hexdigest(), sourceHashes={t['id']:t['sha256'] for t in catalog['tracks']}, tracks=tracks)
    (ASSETS / 'game-music.json').write_text(json.dumps(index, indent=2)+'\n')
    (ROOT / 'docs/audio/game-music-measurements.json').write_text(json.dumps(measurements, indent=2)+'\n')
    print(json.dumps(dict(bytes=len(pack), measurements=measurements), indent=2))

if __name__ == '__main__':
    main()

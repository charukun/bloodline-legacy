// Asset decode completes before the renderer creates GPU resources.
try{await AssetBank.load();installTerrainGeometry();Renderer=SliceRenderer;AudioEngine=WorldAudio;new Game();}catch(e){console.error(e);const l=document.getElementById('loading');l.textContent='支度を続けられませんでした: '+e.message;}

/* Offline-only sample renderer. Build with TinySoundFont's MIT-licensed tsf.h.
 * Game clients receive compressed recordings; no synth or SoundFont at runtime. */
#define TSF_IMPLEMENTATION
#include "tsf.h"
#include <stdio.h>
#include <stdlib.h>

int main(int argc,char **argv){
 if(argc!=4){fprintf(stderr,"Usage: render_score font.sf2 score.events output.f32\n");return 1;}
 tsf *s=tsf_load_filename(argv[1]);if(!s)return 2;
 FILE *in=fopen(argv[2],"r"),*out=fopen(argv[3],"wb");if(!in||!out)return 3;
 int rate=44100,kind,ch,key,value;double end,at;long cursor=0;float buffer[1024];
 if(fscanf(in,"%lf",&end)!=1)return 4;
 tsf_set_output(s,TSF_STEREO_INTERLEAVED,rate,-10);tsf_set_max_voices(s,160);
 while(fscanf(in,"%lf %d %d %d %d",&at,&kind,&ch,&key,&value)==5){
  long until=(long)(at*rate+.5);
  while(cursor<until){int n=(int)((until-cursor)>512?512:until-cursor);tsf_render_float(s,buffer,n,0);fwrite(buffer,sizeof(float),n*2,out);cursor+=n;}
  if(kind==0)tsf_channel_note_off(s,ch,key);
  else if(kind==1)tsf_channel_note_on(s,ch,key,value/127.f);
  else if(kind==2){if(!tsf_channel_set_presetnumber(s,ch,key,ch==9)){fprintf(stderr,"Missing program %d\n",key);return 5;}}
  else if(kind==3)tsf_channel_midi_control(s,ch,key,value);
 }
 long until=(long)(end*rate+.5);
 while(cursor<until){int n=(int)((until-cursor)>512?512:until-cursor);tsf_render_float(s,buffer,n,0);fwrite(buffer,sizeof(float),n*2,out);cursor+=n;}
 fclose(in);fclose(out);tsf_close(s);return 0;
}

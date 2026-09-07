import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright
R=Path(__file__).resolve().parents[1];O=R/'tests/current';O.mkdir(exist_ok=True)
def html():
 text=(R/'dist/index.html').read_text().replace("if(!new URLSearchParams(location.search).has('qa'))return;","if(false)return;")
 return text.replace('<body>', '''<body><script>window.testStore={'aerin.tactics.v3.profile':JSON.stringify({sound:false,quality:'medium',uiExplained:true})};Object.defineProperty(window,'localStorage',{value:{getItem:k=>testStore[k]??null,setItem:(k,v)=>{testStore[k]=v},removeItem:k=>{delete testStore[k]}}});</script>''')
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=False,env={**os.environ,'DISPLAY':':99'},args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
  page=await browser.new_page(viewport={'width':1000,'height':900},device_scale_factor=1)
  errors=[];cons=[]
  page.on('pageerror',lambda e:(errors.append(str(e)),print('PAGE ERROR',str(e),flush=True)))
  page.on('console',lambda m:(cons.append({'type':m.type,'text':m.text}),print('CONSOLE',m.type,m.text[:600],flush=True)))
  await page.set_content(html(),wait_until='load')
  try:await page.wait_for_function('window.AERIN_QA && AERIN_QA.app.renderer.frame>2',timeout=60000)
  except Exception as e:print('BOOTFAIL',str(e),flush=True);await page.screenshot(path=str(O/'boot-error.png'));(O/'smoke.json').write_text(json.dumps({'errors':errors,'console':cons},ensure_ascii=False));await browser.close();return
  await page.screenshot(path=str(O/'clan-first.png'));print('BOOT',await page.evaluate('AERIN_QA.stats()'),flush=True)
  print('buttons',await page.locator('button').evaluate_all('(nodes)=>nodes.map(e=>({id:e.id,text:e.innerText}))'),flush=True)
  await page.locator('#begin-life').click();await page.wait_for_timeout(1000)
  print('after begin',await page.evaluate('({screen:AERIN_QA.app.screen,modal:AERIN_QA.app.ui.modal,p:!!AERIN_QA.player()})'),flush=True)
  if await page.evaluate('AERIN_QA.app.screen!=="game"'):
   await page.evaluate('AERIN_QA.app.profile.uiExplained=true;AERIN_QA.app.ui.closeModal();AERIN_QA.app.start()')
  await page.wait_for_timeout(1000)
  await page.evaluate('''(()=>{const q=AERIN_QA,p=q.player();q.age(17);q.place(0,0);q.app.ui.closeModal();p.name='リオ';p.weapon=0;p.armor=0;p.shield=false;p.hair=0;p.race=0;p.dir=.3;p.appearanceSeed=18;q.step(1);q.app.renderer.camera={x:0,z:-2,zoom:16,yaw:.42,pitch:.68};})()''')
  await page.wait_for_timeout(1800);await page.screenshot(path=str(O/'village-first.png'));print('VILLAGE',await page.evaluate('AERIN_QA.stats()'),flush=True)
  await page.evaluate('AERIN_QA.app.renderer.weather.setOverride("rain")');await page.wait_for_timeout(1500);await page.screenshot(path=str(O/'rain-first.png'));print('RAIN',await page.evaluate('AERIN_QA.stats()'),flush=True)
  (O/'smoke.json').write_text(json.dumps({'errors':errors,'console':cons,'stats':await page.evaluate('AERIN_QA.stats()')},ensure_ascii=False,indent=2));await browser.close()
asyncio.run(main())

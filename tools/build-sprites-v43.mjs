import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try {
 const page=await browser.newPage();await page.goto('http://127.0.0.1:8080');
 const result=await page.evaluate(async()=>{
  const load=async path=>{const im=new Image();im.src=path;await im.decode();return im;};
  const canvas=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
  const out={};
  // Register at the belt, moving the entire drawing and its held weapon together.
  for(const [name,count,rows] of [['neon-run',12,2],['inda-run',12,2],['inda-weapon',18,1]]){
   const im=await load('assets/characters/v42/'+name+'.png'),c=canvas(im.width,im.height),ctx=c.getContext('2d');
   const tile=canvas(384,240),tc=tile.getContext('2d'),shifts=[];
   for(let f=0;f<count;f++){
    tc.clearRect(0,0,384,240);tc.drawImage(im,f*384,rows===2?240:0,384,240,0,0,384,240);
    const px=tc.getImageData(0,0,384,240).data;let sum=0,n=0;
    for(let y=164;y<174;y++)for(let x=105;x<205;x++){const k=(y*384+x)*4;if(px[k+3]>170&&(px[k]+px[k+1]+px[k+2])/3<115){sum+=x;n++;}}
    let dx=n?Math.max(-28,Math.min(28,Math.round(154-sum/n))):0;
    // Full-body run extremes are deliberately kept; avoid shifting the accepted bow.
    shifts.push(dx);ctx.save();ctx.beginPath();ctx.rect(f*384,0,384,rows*240);ctx.clip();ctx.drawImage(im,f*384,0,384,rows*240,f*384+dx,0,384,rows*240);ctx.restore();
   }
   out[name]={png:c.toDataURL(),shifts};
  }
  const im=await load('assets/characters/v43/dash-source.png'),c=canvas(384*12,240),ctx=c.getContext('2d'),sw=im.width/4,sh=im.height/3;
  const tile=canvas(Math.ceil(sw),Math.ceil(sh)),tc=tile.getContext('2d');
  for(let f=0;f<12;f++){
   tc.clearRect(0,0,tile.width,tile.height);tc.drawImage(im,(f%4)*sw,Math.floor(f/4)*sh,sw,sh,0,0,sw,sh);
   const data=tc.getImageData(0,0,tile.width,tile.height),p=data.data,w=tile.width,h=tile.height,seen=new Uint8Array(w*h),components=[];
   for(let start=0;start<w*h;start++)if(!seen[start]&&p[start*4+3]>30){const list=[start];seen[start]=1;for(let q=0;q<list.length;q++){const k=list[q],x=k%w;for(const n of [x>0?k-1:-1,x<w-1?k+1:-1,k-w,k+w])if(n>=0&&n<w*h&&!seen[n]&&p[n*4+3]>30){seen[n]=1;list.push(n);}}components.push(list);}
   const largest=Math.max(...components.map(a=>a.length)),keep=new Uint8Array(w*h);
   for(const list of components)if(list.length>largest*.08)for(const k of list)keep[k]=1;
   let bottom=0;for(let k=0;k<w*h;k++){if(!keep[k])p[k*4+3]=0;else if(p[k*4+3]>180)bottom=Math.max(bottom,Math.floor(k/w));}
   tc.putImageData(data,0,0);
   const scale=.50;ctx.save();ctx.beginPath();ctx.rect(f*384,0,384,240);ctx.clip();
   // Consistent body/foot registration, same scale for all twelve poses.
   ctx.drawImage(tile,f*384+154-sw*.58*scale,228-bottom*scale,sw*scale,sh*scale);ctx.restore();
  }
  out['neon-dash']={png:c.toDataURL(),frames:12,scale:.50};return out;
 });
 const manifest={};for(const [name,r] of Object.entries(result)){await writeFile('assets/characters/v43/'+name+'.png',Buffer.from(r.png.split(',')[1],'base64'));const {png,...meta}=r;manifest[name]=meta;}
 await writeFile('assets/characters/v43/frames.json',JSON.stringify(manifest,null,2)+'\n');console.log(manifest);
}finally{await browser.close();}

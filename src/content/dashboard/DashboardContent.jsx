import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {DataComponent, Dropdown, SegmentedControl, useDataApp} from '../../data-app-public.jsx';
import geography from '../assets/world.json';
import {ThemeControl, ThemeNetwork} from './ThemeNetwork.jsx';
import {countryAnchors, thematicNetwork, themeLabels} from './thematic-network.js';
import './atlas.css';

const unique=(rows,key)=>new Set(rows.map(r=>r[key])).size;
const project=([lon,lat])=>[lon,-Math.log(Math.tan(Math.PI/4+Math.max(-82,Math.min(82,lat))*Math.PI/360))*180/Math.PI];
const countryPaths=geography.map(f=>({...f,path:(f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates).map(poly=>poly.map(ring=>ring.map((p,i)=>`${i?'L':'M'}${project(p).map(n=>n.toFixed(3)).join(',')}`).join('')+'Z').join('')).join('')}));
const presets={med:[-15,-75,59,42],italy:[5,-56,16,16],world:[-32,-104,148,116]};
const labels=[['ITALY',12,42],['FRANCE',2,47],['SPAIN',-4,39],['GREECE',24,38],['ALGERIA',3,30],['TURKEY',34,40],['PORTUGAL',-9,39],['UNITED KINGDOM',-2,55],['TUNISIA',9,33],['EGYPT',30,28]];
function siteRows(rows){return [...new Set(rows.map(r=>r.inst_id))].map(id=>{const records=rows.filter(r=>r.inst_id===id);return {...records[0],authors:unique(records,'author'),papers:unique(records,'title'),records};});}
function fitSites(sites,padding=1.5){
 if(!sites.length)return presets.med;
 const pp=sites.map(s=>project([s.longitude,s.latitude])),xs=pp.map(p=>p[0]),ys=pp.map(p=>p[1]);
 const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys),w=Math.max(10,(right-left)*padding),h=Math.max(8,(bottom-top)*padding);
 return [(left+right-w)/2,(top+bottom-h)/2,w,h];
}
function mapBox([x,y,w,h], {width,height}, thematic, compact, overview, layout) {
 const left=thematic?(overview||compact?22:Math.max(272,(layout?.panel.right??0)+16)):0, right=thematic?48:0;
 const bottom=thematic?(overview?Math.min(layout?.bottomInset??128,height*.36):Math.min(100,height*.17)):0;
 const top=thematic?(overview?Math.min(layout?.topInset??116,height*.42):
  compact?Math.min(Math.max(122,(layout?.panel.bottom??0)+24),Math.max(0,height-bottom-100)):40):0;
 const usableWidth=Math.max(1,width-left-right), usableHeight=Math.max(1,height-top-bottom);
 const unit=Math.max(w/usableWidth,h/usableHeight);
 return [x+w/2-(left+usableWidth/2)*unit,y+h/2-(top+usableHeight/2)*unit,width*unit,height*unit];
}
function LocationPopup({sites,onClose}){
 const [details,setDetails]=useState(false),first=sites[0];
 useEffect(()=>{const close=e=>{if(e.key==='Escape')onClose();};document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close);},[onClose]);
 return <aside className="location-popup" aria-label={`Institutions in ${first.city}`} data-reviewed-rows="true">
  <button className="popup-close" onClick={onClose} aria-label="Close location">×</button>
  <span className="location-country">{first.country}</span><h2>{first.city}</h2>
  {sites.map(s=><div className="popup-institution" key={s.inst_id}><strong>{s.institution}</strong><span>{s.authors} {s.authors===1?'author':'authors'} · {s.papers} {s.papers===1?'contribution':'contributions'}</span></div>)}
  {sites.some(s=>s.needs_review)&&<p className="popup-review">The specific branch of {sites.filter(s=>s.needs_review).map(s=>s.short_name).join(', ')} has not been confirmed.</p>}
  <button className="popup-detail-toggle" onClick={()=>setDetails(!details)} aria-expanded={details}>{details?'Hide details':'Authors and contributions'} {details?'−':'+'}</button>
  {details&&<div className="popup-details"><p>{[...new Set(sites.flatMap(s=>s.records.map(r=>r.author)))].sort().join(' · ')}</p><ul>{[...new Set(sites.flatMap(s=>s.records.map(r=>r.title)))].sort().map(title=><li key={title}>{title}</li>)}</ul><p>City-level location. {first.latitude.toFixed(5)}°, {first.longitude.toFixed(5)}°.</p><a href={first.location_source} target="_blank" rel="noreferrer">Location reference ↗</a></div>}
 </aside>;
}
function PresentationMap({rows,country,setCountry,countries,anchors,layer,setLayer,theme,setTheme}){
 const sites=useMemo(()=>siteRows(rows),[rows]);
 const thematic=layer==='themes';
 const overview=thematic&&theme==='all';
 const network=useMemo(()=>thematicNetwork(rows,theme,anchors),[rows,theme,anchors]);
 const fitTheme=(nodes,id=theme)=>fitSites(nodes.length?nodes:sites,id==='all'?1.2:1.5);
 const [camera,setCamera]=useState(()=>thematic?fitTheme(network.nodes):country==='all'?presets.med:fitSites(sites));
 const [view,setView]=useState(thematic?'world':country==='all'?'med':'custom'),[links,setLinks]=useState(true),[selected,setSelected]=useState(null),[hover,setHover]=useState(null),[fullscreen,setFullscreen]=useState(false),[fullscreenError,setFullscreenError]=useState('');
 const root=useRef(null),svg=useRef(null),drag=useRef(null),themePanel=useRef(null),[size,setSize]=useState({width:1200,height:750});
 const [themeLayout,setThemeLayout]=useState(null);
 const [highlightedTheme,setHighlightedTheme]=useState(null);
 const compact=size.width<620;
 useEffect(()=>{const observer=new ResizeObserver(([entry])=>setSize({width:Math.max(1,entry.contentRect.width),height:Math.max(1,entry.contentRect.height)}));if(svg.current)observer.observe(svg.current);return()=>observer.disconnect();},[]);
 useEffect(()=>{const update=()=>setFullscreen(Boolean(document.fullscreenElement));document.addEventListener('fullscreenchange',update);return()=>document.removeEventListener('fullscreenchange',update);},[]);
 useEffect(()=>{const node=svg.current;if(!node)return;const wheel=e=>{e.preventDefault();const factor=Math.exp(Math.max(-.18,Math.min(.18,e.deltaY*.001)));setCamera(([x,y,w,h])=>{const width=Math.max(3,Math.min(350,w*factor)),height=h*width/w;return[x+(w-width)/2,y+(h-height)/2,width,height];});setView('custom');};node.addEventListener('wheel',wheel,{passive:false});return()=>node.removeEventListener('wheel',wheel);},[]);
 useLayoutEffect(()=>{
  const overlay=themePanel.current,mapNode=svg.current;
  if(!thematic||!overlay||!mapNode)return;
  const panel=overlay.querySelector('.thematic-control');
  const topBand=overlay.querySelector('[data-theme-band="top"]');
  const bottomBand=overlay.querySelector('[data-theme-band="bottom"]');
  const nodes=[...overlay.querySelectorAll('[data-theme-origin]')];
  const measure=()=>{
   const mapRect=mapNode.getBoundingClientRect();
   const relativeRect=element=>{
    const {left,right,top,bottom}=element.getBoundingClientRect();
    return {left:left-mapRect.left,right:right-mapRect.left,top:top-mapRect.top,bottom:bottom-mapRect.top};
   };
   const panelRect=relativeRect(panel);
   const obstacles=[panelRect];
   const origins=Object.fromEntries(nodes.map(button=>{
    const rect=relativeRect(button);
    obstacles.push(rect);
    const y=button.closest('[data-theme-band]').dataset.themeBand==='top'?rect.bottom:rect.top;
    return [button.dataset.themeOrigin,[(rect.left+rect.right)/2,y]];
   }));
   const {left,right,top,bottom}=panelRect;
   if(!overview)origins[theme]=compact?[(left+right)/2,bottom]:[right,(top+bottom)/2];
   const topInset=(topBand?relativeRect(topBand).bottom:bottom)+20;
   const bottomInset=bottomBand?mapRect.height-relativeRect(bottomBand).top+20:90;
   setThemeLayout({panel:panelRect,origins,obstacles,topInset,bottomInset});
  };
  measure();
  const observer=new ResizeObserver(measure);
  for(const element of [mapNode,panel,topBand,bottomBand].filter(Boolean))observer.observe(element);
  return()=>observer.disconnect();
 },[thematic,compact,overview,theme,network.themeIds]);
 const box=useMemo(()=>mapBox(camera,size,thematic,compact,overview,themeLayout),[camera,size,thematic,compact,overview,themeLayout]);
 const unit=box[2]/size.width;
 const groups=useMemo(()=>{
  const exact=new Map();for(const site of sites){const key=site.longitude+','+site.latitude;if(!exact.has(key))exact.set(key,[]);exact.get(key).push(site);}
  const ordered=[...exact.values()].sort((a,b)=>unique(b.flatMap(s=>s.records),'author')-unique(a.flatMap(s=>s.records),'author'));
  const grouped=[];for(const batch of ordered){const[x,y]=project([batch[0].longitude,batch[0].latitude]);const nearby=grouped.find(ss=>{const[xx,yy]=project([ss[0].longitude,ss[0].latitude]);return Math.hypot(x-xx,y-yy)<34*unit;});if(nearby)nearby.push(...batch);else grouped.push([...batch]);}return grouped;
 },[sites,unit]);
 const codes=new Set(thematic?network.nodes.map(node=>node.code):sites.map(site=>site.country_code));
 const edges=useMemo(()=>{const result=new Map();for(const pid of new Set(rows.map(r=>r.title))){const list=siteRows(rows.filter(r=>r.title===pid));for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){const a=list[i],b=list[j];if(a.longitude===b.longitude&&a.latitude===b.latitude)continue;const id=[a.inst_id,b.inst_id].sort().join(':');if(!result.has(id))result.set(id,{id,a,b,count:0});result.get(id).count++;}}return [...result.values()];},[rows]);
 const selectedGroup=groups.find(ss=>ss.some(s=>s.inst_id===selected));
 const origins=Object.fromEntries(Object.entries(themeLayout?.origins??{}).map(([id,point])=>
  [id,point.map((value,index)=>box[index]+value*unit)]));
 const themePoints=thematic?network.nodes.flatMap(node=>{
  const [x,y]=project([node.longitude,node.latitude]);
  const px=(x-box[0])/unit,py=(y-box[1])/unit;
  if(px<14||px>size.width-14||py<14||py>size.height-14)return [];
  if(themeLayout?.obstacles.some(({left,right,top,bottom})=>px>left-15&&px<right+15&&py>top-15&&py<bottom+15))return [];
  return [{...node,x,y,px,py}];
 }):[];
 const visibleThemePoints=themePoints.map(point=>{
  const reach=point.country.length*6.8+24;
  const obstructed=direction=>themePoints.some(other=>{
   const distance=(other.px-point.px)*direction;
   return distance>0&&distance<reach&&Math.abs(other.py-point.py)<20;
  });
  const rightBlocked=point.px+reach>size.width-8||obstructed(1);
  const leftBlocked=point.px<reach+8||obstructed(-1);
  const labelSide=rightBlocked?(leftBlocked?0:-1):1;
  return {...point,labelSide};
 });
 const outside=thematic?network.nodes.length-visibleThemePoints.length:sites.filter(s=>{const[x,y]=project([s.longitude,s.latitude]);return x<box[0]||x>box[0]+box[2]||y<box[1]||y>box[1]+box[3];}).length;
 const go=id=>{setView(id);setCamera(id==='world'?(thematic?fitTheme(network.nodes):fitSites(sites)):presets[id]);setSelected(null);setHover(null);};
 const changeLayer=next=>{
  if(next===layer)return;
  setLayer(next);setSelected(null);setHover(null);setHighlightedTheme(null);
  setView(next==='themes'?'world':country==='all'?'med':'custom');
  setCamera(next==='themes'?fitTheme(network.nodes):country==='all'?presets.med:fitSites(sites));
 };
 const changeTheme=next=>{
  const focusedNode=document.activeElement?.hasAttribute('data-theme-origin');
  setHighlightedTheme(null);
  setTheme(next);
  setView('world');
  setCamera(fitTheme(thematicNetwork(rows,next,anchors).nodes,next));
  if(focusedNode)requestAnimationFrame(()=>themePanel.current?.querySelector('[aria-label="Research theme"]')?.focus());
 };
 const zoom=f=>{setCamera(([x,y,w,h])=>{const nw=Math.max(3,Math.min(350,w*f)),nh=h*nw/w;return[x+(w-nw)/2,y+(h-nh)/2,nw,nh];});setView('custom');};
 const reset=()=>{setLayer('affiliations');setTheme('ai');setHighlightedTheme(null);setCountry('all');setLinks(true);go('med');};
 async function present(){try{if(document.fullscreenElement)await document.exitFullscreen();else await root.current.requestFullscreen();setFullscreenError('');}catch{setFullscreenError('Full screen is unavailable in this preview. Open the HTML file in a browser to present it.');}}
 function pointerDown(e){if(e.target.closest('[data-marker]'))return;drag.current={x:e.clientX,y:e.clientY,camera,unit,moved:false};svg.current.setPointerCapture(e.pointerId);}
 function pointerMove(e){const d=drag.current;if(!d)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;d.moved=d.moved||Math.abs(dx)+Math.abs(dy)>4;const[x,y,w,h]=d.camera;setCamera([x-dx*d.unit,y-dy*d.unit,w,h]);setView('custom');setHover(null);}
 function pointerUp(){if(drag.current&&!drag.current.moved)setSelected(null);drag.current=null;}
 const controls=<div className="presentation-controls"><SegmentedControl value={view} onChange={go} options={[{value:'med',label:'Mediterranean'},{value:'italy',label:'Italy'},{value:'world',label:'All locations'}]}/><Dropdown label="Country" value={country} choices={['all',...countries]} allLabel="All countries" onChange={setCountry}/>
  <SegmentedControl ariaLabel="Map layer" value={layer} onChange={changeLayer} options={[{value:'affiliations',label:'Affiliations'},{value:'themes',label:'Thematic network'}]}/>
  {!thematic&&<label className="presentation-links"><input type="checkbox" checked={links} onChange={e=>setLinks(e.target.checked)}/> Co-authorship</label>}<span className="toolbar-divider"/><button className="map-tool" onClick={reset} title="Reset map" aria-label="Reset map">↺</button><button className="map-tool present-button" onClick={present} aria-label={fullscreen?'Exit full screen':'Present full screen'} title={fullscreen?'Exit full screen':'Present full screen'}>⛶</button></div>;
 const description=thematic
  ? 'Editorial themes from contribution titles and keywords, joined to public programme affiliations. Each link counts distinct contributions with an affiliation in that country. Country markers use representative affiliation locations.'
  : 'Author affiliations for mapped public-programme contributions. Numbers count unique authors in each group of institutions. Click to zoom and separate nearby locations. City-level precision; the individual branches of INAIL and the University of Campania are unconfirmed.';
 return <div className="presentation-stage" ref={root}>
  <DataComponent id="geographic-atlas" queryId="author_papers" kind="custom" title={thematic?'Thematic network':'Author affiliations'} variant="plain" showHeading={false} showActions={false} headerControls={controls} className="presentation-evidence"
   sourceRows={thematic?network.rows:rows} displayRows={thematic?network.nodes.map(({links,...node})=>node):sites.map(({records,...s})=>s)}
   scopeFilters={{population:'Mapped public-programme contributions',country,...(thematic?{theme:themeLabels[theme]}:{})}} description={description}>
   <div className={`presentation-canvas${thematic?' thematic-canvas':''}`} data-overview={overview}>
    <svg ref={svg} viewBox={box.join(' ')} aria-label={thematic?'MedCHI network of research themes and countries.':'MedCHI author affiliations map. Drag to pan and use the scroll wheel or zoom buttons.'} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={()=>drag.current=null}>
     <defs><pattern id="atlas-graticule" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="#b8cbd3" strokeWidth=".035"/></pattern></defs>
     <rect x="-360" y="-360" width="720" height="720" fill="#e1edf1"/><rect x="-360" y="-360" width="720" height="720" fill="url(#atlas-graticule)"/>
     {countryPaths.map(f=><path key={f.name} d={f.path} fill={codes.has(f.iso2)?'#cfddda':'#f4f3ec'} stroke="#a8bab9" strokeWidth=".6" vectorEffect="non-scaling-stroke"/>)}
     {!thematic&&box[2]<110&&labels.map(([name,lon,lat])=>{const[x,y]=project([lon,lat]);return <text key={name} x={x} y={y} fill="#718d94" fontSize={10*unit} letterSpacing={1.6*unit} textAnchor="middle" pointerEvents="none">{name}</text>;})}
     {!thematic&&links&&edges.map(({id,a,b,count})=>{const[x,y]=project([a.longitude,a.latitude]),[xx,yy]=project([b.longitude,b.latitude]);return <path key={id} d={`M${x},${y} Q${(x+xx)/2},${(y+yy)/2-Math.abs(x-xx)*.15} ${xx},${yy}`} fill="none" stroke="#176a85" strokeOpacity=".4" strokeWidth={(1.5+Math.log(count))*unit}><title>{a.short_name} ↔ {b.short_name}: {count} shared contributions</title></path>;})}
     {thematic?<ThemeNetwork points={visibleThemePoints} origins={origins} compact={compact} unit={unit} theme={theme}
       highlighted={highlightedTheme} country={country} onCountry={setCountry}/>:groups.map(ss=>{const first=ss[0],[x,y]=project([first.longitude,first.latitude]),authors=unique(ss.flatMap(s=>s.records),'author'),host=ss.some(s=>s.inst_id==='I011'),chosen=ss.some(s=>s.inst_id===selected),r=(8+Math.sqrt(authors)*2.3)*unit;
      const cities=[...new Set(ss.map(s=>s.city))],cityLabel=cities.join(' / ');
      const open=()=>{setHover(null);if(cities.length>1){const points=ss.map(s=>project([s.longitude,s.latitude])),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),w=Math.max(.6,(Math.max(...xs)-Math.min(...xs))*2),h=Math.max(.6,(Math.max(...ys)-Math.min(...ys))*2);setCamera([(Math.min(...xs)+Math.max(...xs)-w)/2,(Math.min(...ys)+Math.max(...ys)-h)/2,w,h]);setView('custom');setSelected(null);}else setSelected(chosen?null:first.inst_id);};
      return <g key={first.inst_id} data-marker="true" className="presentation-marker" role="button" tabIndex="0" aria-label={`${cityLabel}: ${ss.map(s=>s.short_name).join(', ')}, ${authors} authors. ${cities.length>1?'Zoom into locations':'Open location'}`} onClick={open} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}}} onMouseEnter={()=>setHover({city:cityLabel,names:ss.map(s=>s.short_name).join(' · ')})} onMouseLeave={()=>setHover(null)} onFocus={()=>setHover({city:cityLabel,names:ss.map(s=>s.short_name).join(' · ')})} onBlur={()=>setHover(null)}>
       {(host||chosen)&&<circle cx={x} cy={y} r={r+5*unit} fill="none" stroke={host?'#bd7e36':'#17617b'} strokeWidth={2*unit} opacity=".65"/>}
       <circle cx={x} cy={y} r={r} fill={host?'#b67b35':'#17617b'} fillOpacity=".94" stroke="#fff" strokeWidth={2*unit}/><text x={x} y={y+4*unit} textAnchor="middle" fontSize={12*unit} fontWeight="650" fill="white" pointerEvents="none">{authors}</text><title>{first.city} · {ss.map(s=>s.short_name).join(', ')} · {authors} authors</title>
      </g>;
     })}
    </svg>
    {thematic&&<ThemeControl panelRef={themePanel} theme={theme} onChange={changeTheme} network={network}
      highlight={setHighlightedTheme}/>}
    <div className="map-zoom-tools"><button aria-label="Zoom in" onClick={()=>zoom(.7)}>+</button><button aria-label="Zoom out" onClick={()=>zoom(1.4)}>−</button></div>
    {outside>0&&<button className="map-outliers" onClick={()=>go('world')}>{outside} {thematic?(outside===1?'country':'countries'):(outside===1?'location':'locations')} outside view ↗</button>}
    {hover&&!selectedGroup&&<div className="map-hover-caption"><strong>{hover.city}</strong><span>{hover.names}</span></div>}
    {selectedGroup&&<LocationPopup key={selectedGroup[0].inst_id} sites={selectedGroup} onClose={()=>setSelected(null)}/>}
    <div className="map-signature"><strong>MedCHI Connect <span>2026</span></strong><span>{thematic?'Thematic network':'Author affiliations'}</span></div>
    <div className="presentation-footnote"><span>{thematic?<><i className="legend-blue"/> {theme==='all'?'Distinct contributions per country':'Contributions per country'} · click a country to filter</>:<><i className="legend-blue"/> Authors · click clusters to zoom <i className="legend-gold"/> MedCHI · Fisciano</>}</span><span>{thematic?'Representative affiliations':'City-level locations'} · <a href="https://www.naturalearthdata.com/" target="_blank" rel="noreferrer">Natural Earth</a> · GeoNames / ROR · OSM · <a href="https://sites.google.com/unisa.it/medchi2026-connect/program/program" target="_blank" rel="noreferrer">Programme</a></span></div>
    {fullscreenError&&<div className="presentation-message" role="status">{fullscreenError}<button onClick={()=>setFullscreenError('')} aria-label="Close notice">×</button></div>}
   </div>
  </DataComponent>
 </div>;
}
export function DashboardContent(){
 const {queries,filters,setFilter}=useDataApp(),base=(queries.author_papers?.rows||[]),country=filters.country||'all';
 const [layer,setLayer]=useState('affiliations'),[theme,setTheme]=useState('ai');
 const rows=useMemo(()=>base.filter(r=>country==='all'||r.country===country),[base,country]);
 const anchors=useMemo(()=>countryAnchors(base),[base]);
 const countries=[...new Set(base.map(r=>r.country))].sort();
 return <article className="map-presentation" data-dashboard-layout="viewport"><PresentationMap key={country} rows={rows} country={country}
  setCountry={v=>setFilter('country',v)} countries={countries} anchors={anchors} layer={layer} setLayer={setLayer} theme={theme} setTheme={setTheme}/></article>;
}

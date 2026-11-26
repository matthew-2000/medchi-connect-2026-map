import React, {useEffect, useMemo, useRef, useState} from 'react';
import {DataComponent, Dropdown, SegmentedControl, useDataApp} from '../../data-app-public.jsx';
import geography from '../assets/world.json';
import './atlas.css';

const unique=(rows,key)=>new Set(rows.map(r=>r[key])).size;
const project=([lon,lat])=>[lon,-Math.log(Math.tan(Math.PI/4+Math.max(-82,Math.min(82,lat))*Math.PI/360))*180/Math.PI];
const countryPaths=geography.map(f=>({...f,path:(f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates).map(poly=>poly.map(ring=>ring.map((p,i)=>`${i?'L':'M'}${project(p).map(n=>n.toFixed(3)).join(',')}`).join('')+'Z').join('')).join('')}));
const presets={med:[-15,-75,59,42],italy:[5,-56,16,16],world:[-32,-104,148,116]};
const labels=[['ITALY',12,42],['FRANCE',2,47],['SPAIN',-4,39],['GREECE',24,38],['ALGERIA',3,30],['TURKEY',34,40],['PORTUGAL',-9,39],['UNITED KINGDOM',-2,55],['TUNISIA',9,33],['EGYPT',30,28]];
function siteRows(rows){return [...new Set(rows.map(r=>r.inst_id))].map(id=>{const records=rows.filter(r=>r.inst_id===id);return {...records[0],authors:unique(records,'author'),papers:unique(records,'title'),records};});}
function fitSites(sites){
 if(!sites.length)return presets.med;
 const pp=sites.map(s=>project([s.longitude,s.latitude])),xs=pp.map(p=>p[0]),ys=pp.map(p=>p[1]);
 const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys),w=Math.max(10,(right-left)*1.5),h=Math.max(8,(bottom-top)*1.5);
 return [(left+right-w)/2,(top+bottom-h)/2,w,h];
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
function PresentationMap({rows,country,setCountry,countries}){
 const sites=useMemo(()=>siteRows(rows),[rows]);
 const [camera,setCamera]=useState(()=>country==='all'?presets.med:fitSites(sites));
 const [view,setView]=useState(country==='all'?'med':'custom'),[links,setLinks]=useState(true),[selected,setSelected]=useState(null),[hover,setHover]=useState(null),[fullscreen,setFullscreen]=useState(false),[fullscreenError,setFullscreenError]=useState('');
 const root=useRef(null),svg=useRef(null),drag=useRef(null),[size,setSize]=useState({width:1200,height:750});
 useEffect(()=>{const observer=new ResizeObserver(([entry])=>setSize({width:Math.max(1,entry.contentRect.width),height:Math.max(1,entry.contentRect.height)}));if(svg.current)observer.observe(svg.current);return()=>observer.disconnect();},[]);
 useEffect(()=>{const update=()=>setFullscreen(Boolean(document.fullscreenElement));document.addEventListener('fullscreenchange',update);return()=>document.removeEventListener('fullscreenchange',update);},[]);
 useEffect(()=>{const node=svg.current;if(!node)return;const wheel=e=>{e.preventDefault();const factor=Math.exp(Math.max(-.18,Math.min(.18,e.deltaY*.001)));setCamera(([x,y,w,h])=>{const width=Math.max(3,Math.min(350,w*factor)),height=h*width/w;return[x+(w-width)/2,y+(h-height)/2,width,height];});setView('custom');};node.addEventListener('wheel',wheel,{passive:false});return()=>node.removeEventListener('wheel',wheel);},[]);
 const box=useMemo(()=>{const [x,y,w,h]=camera,aspect=size.width/size.height,width=Math.max(w,h*aspect),height=width/aspect;return[x+(w-width)/2,y+(h-height)/2,width,height];},[camera,size]);
 const unit=box[2]/size.width;
 const groups=useMemo(()=>{
  const exact=new Map();for(const site of sites){const key=site.longitude+','+site.latitude;if(!exact.has(key))exact.set(key,[]);exact.get(key).push(site);}
  const ordered=[...exact.values()].sort((a,b)=>unique(b.flatMap(s=>s.records),'author')-unique(a.flatMap(s=>s.records),'author'));
  const grouped=[];for(const batch of ordered){const[x,y]=project([batch[0].longitude,batch[0].latitude]);const nearby=grouped.find(ss=>{const[xx,yy]=project([ss[0].longitude,ss[0].latitude]);return Math.hypot(x-xx,y-yy)<34*unit;});if(nearby)nearby.push(...batch);else grouped.push([...batch]);}return grouped;
 },[sites,unit]);
 const codes=new Set(sites.map(s=>s.country_code));
 const edges=useMemo(()=>{const result=new Map();for(const pid of new Set(rows.map(r=>r.title))){const list=siteRows(rows.filter(r=>r.title===pid));for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){const a=list[i],b=list[j];if(a.longitude===b.longitude&&a.latitude===b.latitude)continue;const id=[a.inst_id,b.inst_id].sort().join(':');if(!result.has(id))result.set(id,{id,a,b,count:0});result.get(id).count++;}}return [...result.values()];},[rows]);
 const selectedGroup=groups.find(ss=>ss.some(s=>s.inst_id===selected));
 const outside=sites.filter(s=>{const[x,y]=project([s.longitude,s.latitude]);return x<box[0]||x>box[0]+box[2]||y<box[1]||y>box[1]+box[3];}).length;
 const go=id=>{setView(id);setCamera(id==='world'?fitSites(sites):presets[id]);setSelected(null);setHover(null);};
 const zoom=f=>{setCamera(([x,y,w,h])=>{const nw=Math.max(3,Math.min(350,w*f)),nh=h*nw/w;return[x+(w-nw)/2,y+(h-nh)/2,nw,nh];});setView('custom');};
 const reset=()=>{setSelected(null);setHover(null);setCountry('all');setLinks(true);go('med');};
 async function present(){try{if(document.fullscreenElement)await document.exitFullscreen();else await root.current.requestFullscreen();setFullscreenError('');}catch{setFullscreenError('Full screen is unavailable in this preview. Open the HTML file in a browser to present it.');}}
 function pointerDown(e){if(e.target.closest('[data-marker]'))return;drag.current={x:e.clientX,y:e.clientY,box:[...box],moved:false};svg.current.setPointerCapture(e.pointerId);}
 function pointerMove(e){const d=drag.current;if(!d)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;d.moved=d.moved||Math.abs(dx)+Math.abs(dy)>4;setCamera([d.box[0]-dx*d.box[2]/size.width,d.box[1]-dy*d.box[3]/size.height,d.box[2],d.box[3]]);setView('custom');setHover(null);}
 function pointerUp(){if(drag.current&&!drag.current.moved)setSelected(null);drag.current=null;}
 const controls=<div className="presentation-controls"><SegmentedControl value={view} onChange={go} options={[{value:'med',label:'Mediterranean'},{value:'italy',label:'Italy'},{value:'world',label:'All locations'}]}/><Dropdown label="Country" value={country} choices={['all',...countries]} allLabel="All countries" onChange={setCountry}/><label className="presentation-links"><input type="checkbox" checked={links} onChange={e=>setLinks(e.target.checked)}/> Co-authorship</label><span className="toolbar-divider"/><button className="map-tool" onClick={reset} title="Reset map" aria-label="Reset map">↺</button><button className="map-tool present-button" onClick={present} aria-label={fullscreen?'Exit full screen':'Present full screen'} title={fullscreen?'Exit full screen':'Present full screen'}>⛶</button></div>;
 return <div className="presentation-stage" ref={root}>
  <DataComponent id="geographic-atlas" queryId="author_papers" kind="custom" title="Author affiliations" variant="plain" showHeading={false} showActions={false} headerControls={controls} className="presentation-evidence" sourceRows={rows} displayRows={sites.map(({records,...s})=>s)} scopeFilters={{population:'Mapped public-programme contributions',country}} description="Author affiliations for mapped public-programme contributions. Numbers count unique authors in each group of institutions. Click to zoom and separate nearby locations. City-level precision; the individual branches of INAIL and the University of Campania are unconfirmed.">
   <div className="presentation-canvas">
    <svg ref={svg} viewBox={box.join(' ')} aria-label="MedCHI author affiliations map. Drag to pan and use the scroll wheel or zoom buttons." onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={()=>drag.current=null}>
     <defs><pattern id="atlas-graticule" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="#b8cbd3" strokeWidth=".035"/></pattern></defs>
     <rect x="-360" y="-360" width="720" height="720" fill="#e1edf1"/><rect x="-360" y="-360" width="720" height="720" fill="url(#atlas-graticule)"/>
     {countryPaths.map(f=><path key={f.name} d={f.path} fill={codes.has(f.iso2)?'#cfddda':'#f4f3ec'} stroke="#a8bab9" strokeWidth=".6" vectorEffect="non-scaling-stroke"/>)}
     {box[2]<110&&labels.map(([name,lon,lat])=>{const[x,y]=project([lon,lat]);return <text key={name} x={x} y={y} fill="#718d94" fontSize={10*unit} letterSpacing={1.6*unit} textAnchor="middle" pointerEvents="none">{name}</text>;})}
     {links&&edges.map(({id,a,b,count})=>{const[x,y]=project([a.longitude,a.latitude]),[xx,yy]=project([b.longitude,b.latitude]);return <path key={id} d={`M${x},${y} Q${(x+xx)/2},${(y+yy)/2-Math.abs(x-xx)*.15} ${xx},${yy}`} fill="none" stroke="#176a85" strokeOpacity=".4" strokeWidth={(1.5+Math.log(count))*unit}><title>{a.short_name} ↔ {b.short_name}: {count} shared contributions</title></path>;})}
     {groups.map(ss=>{const first=ss[0],[x,y]=project([first.longitude,first.latitude]),authors=unique(ss.flatMap(s=>s.records),'author'),host=ss.some(s=>s.inst_id==='I011'),chosen=ss.some(s=>s.inst_id===selected),r=(8+Math.sqrt(authors)*2.3)*unit;
      const cities=[...new Set(ss.map(s=>s.city))],cityLabel=cities.join(' / ');
      const open=()=>{setHover(null);if(cities.length>1){const points=ss.map(s=>project([s.longitude,s.latitude])),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),w=Math.max(.6,(Math.max(...xs)-Math.min(...xs))*2),h=Math.max(.6,(Math.max(...ys)-Math.min(...ys))*2);setCamera([(Math.min(...xs)+Math.max(...xs)-w)/2,(Math.min(...ys)+Math.max(...ys)-h)/2,w,h]);setView('custom');setSelected(null);}else setSelected(chosen?null:first.inst_id);};
      return <g key={first.inst_id} data-marker="true" className="presentation-marker" role="button" tabIndex="0" aria-label={`${cityLabel}: ${ss.map(s=>s.short_name).join(', ')}, ${authors} authors. ${cities.length>1?'Zoom into locations':'Open location'}`} onClick={open} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}}} onMouseEnter={()=>setHover({city:cityLabel,names:ss.map(s=>s.short_name).join(' · ')})} onMouseLeave={()=>setHover(null)} onFocus={()=>setHover({city:cityLabel,names:ss.map(s=>s.short_name).join(' · ')})} onBlur={()=>setHover(null)}>
       {(host||chosen)&&<circle cx={x} cy={y} r={r+5*unit} fill="none" stroke={host?'#bd7e36':'#17617b'} strokeWidth={2*unit} opacity=".65"/>}
       <circle cx={x} cy={y} r={r} fill={host?'#b67b35':'#17617b'} fillOpacity=".94" stroke="#fff" strokeWidth={2*unit}/><text x={x} y={y+4*unit} textAnchor="middle" fontSize={12*unit} fontWeight="650" fill="white" pointerEvents="none">{authors}</text><title>{first.city} · {ss.map(s=>s.short_name).join(', ')} · {authors} authors</title>
      </g>;
     })}
    </svg>
    <div className="map-zoom-tools"><button aria-label="Zoom in" onClick={()=>zoom(.7)}>+</button><button aria-label="Zoom out" onClick={()=>zoom(1.4)}>−</button></div>
    {outside>0&&<button className="map-outliers" onClick={()=>go('world')}>{outside===1?'1 location outside view':`${outside} locations outside view`} ↗</button>}
    {hover&&!selectedGroup&&<div className="map-hover-caption"><strong>{hover.city}</strong><span>{hover.names}</span></div>}
    {selectedGroup&&<LocationPopup key={selectedGroup[0].inst_id} sites={selectedGroup} onClose={()=>setSelected(null)}/>}
    <div className="map-signature"><strong>MedCHI Connect <span>2026</span></strong><span>Author affiliations</span></div>
    <div className="presentation-footnote"><span><i className="legend-blue"/> Authors · click clusters to zoom <i className="legend-gold"/> MedCHI · Fisciano</span><span>City-level locations · <a href="https://www.naturalearthdata.com/" target="_blank" rel="noreferrer">Natural Earth</a> · GeoNames / ROR · OSM · <a href="https://sites.google.com/unisa.it/medchi2026-connect/program/program" target="_blank" rel="noreferrer">Programme</a></span></div>
    {fullscreenError&&<div className="presentation-message" role="status">{fullscreenError}<button onClick={()=>setFullscreenError('')} aria-label="Close notice">×</button></div>}
   </div>
  </DataComponent>
 </div>;
}
export function DashboardContent(){
 const {queries,filters,setFilter}=useDataApp(),base=(queries.author_papers?.rows||[]),country=filters.country||'all';
 const rows=useMemo(()=>base.filter(r=>country==='all'||r.country===country),[queries,country]);
 return <article className="map-presentation" data-dashboard-layout="viewport"><PresentationMap key={country} rows={rows} country={country} setCountry={v=>setFilter('country',v)} countries={[...new Set(base.map(r=>r.country))].sort()}/></article>;
}

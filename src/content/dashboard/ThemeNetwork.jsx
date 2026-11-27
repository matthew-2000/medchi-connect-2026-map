import React from 'react';
import {Dropdown} from '../../data-app-public.jsx';
import {themeLabels, themes} from './thematic-network.js';

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;
const themeChoices = Object.keys(themeLabels);
const colors = {
  ai: '#17617b',
  xr: '#5d61a0',
  heritage: '#9a6238',
  health: '#935278',
  education: '#247c72',
  nature: '#52753d',
  design: '#527795',
};

function ThemeDock({ids, position, onChange, highlight}) {
  if (!ids.length) return null;
  return <ul className="thematic-dock" data-theme-band={position} aria-label="Research themes">
    {ids.map(id => <li key={id}>
      <button type="button" data-theme-origin={id} onClick={() => onChange(id)}
        onPointerEnter={() => highlight(id)} onPointerLeave={() => highlight(null)}
        onFocus={() => highlight(id)} onBlur={() => highlight(null)}>
        <i style={{backgroundColor: colors[id]}} aria-hidden="true"/>{themes[id]}
      </button>
    </li>)}
  </ul>;
}

export function ThemeControl({panelRef, theme, onChange, network, highlight}) {
  const overview = theme === 'all';
  const countryCount = network.nodes.length;
  const summary = countryCount === 0 ? 'No mapped contributions for this selection.' : overview
    ? `${plural(network.themeIds.length, 'theme')} · ${plural(network.count, 'contribution')} · ${countryCount} ${countryCount === 1 ? 'country' : 'countries'}`
    : null;
  const split = Math.ceil(network.themeIds.length / 2);
  return <section ref={panelRef} className="thematic-overlay" data-overview={overview}
    aria-label="Thematic network" data-reviewed-rows="true">
    <div className="thematic-top">
      <div className="thematic-control">
        {!overview && <span className="thematic-control-label">Research theme</span>}
        <Dropdown label="Research theme" value={theme} choices={themeChoices} choiceLabels={themeLabels}
          allLabel={themeLabels.all} onChange={onChange}/>
        {summary && <p role="status">{summary}</p>}
      </div>
      {overview && <ThemeDock ids={network.themeIds.slice(0, split)} position="top" onChange={onChange} highlight={highlight}/>}
    </div>
    {overview && <ThemeDock ids={network.themeIds.slice(split)} position="bottom" onChange={onChange} highlight={highlight}/>}
  </section>;
}

export function ThemeNetwork({points, origins, compact, unit, theme, highlighted, country, onCountry}) {
  const overview = theme === 'all';
  const edges = points.flatMap(point => point.links.map(link => ({point, ...link})))
    .sort((a, b) => Number(a.theme === highlighted) - Number(b.theme === highlighted));
  return <g className="thematic-network" data-overview={overview} aria-label={`Countries linked to ${themeLabels[theme]}`} data-reviewed-rows="true">
    <g aria-hidden="true">
      {edges.map(({point: {code, country: name, x, y}, theme: id, count}) => {
        const origin = origins[id];
        if (!origin) return null;
        const [startX, startY] = origin;
        const vertical = overview || compact;
        const bend = vertical ? (startY + y) / 2 : (startX + x) / 2;
        const curve = vertical ? `C${startX},${bend} ${x},${bend}` : `C${bend},${startY} ${bend},${y}`;
        return <path key={`${code}-${id}`} className="thematic-edge" data-country={code} data-theme={id}
          data-emphasis={highlighted ? (id === highlighted ? 'active' : 'muted') : undefined}
          style={overview ? {stroke: colors[id]} : undefined}
          d={`M${startX},${startY} ${curve} ${x},${y}`} strokeWidth={overview ? .65 + .6 * Math.sqrt(count) : 1 + .8 * Math.sqrt(count)}>
          <title>{themes[id]} · {name} · {plural(count, 'contribution')}</title>
        </path>;
      })}
      {points.length > 0 && Object.entries(origins).map(([id, [x, y]]) =>
        <circle key={id} cx={x} cy={y} r={3 * unit} className="thematic-origin"
          style={overview ? {fill: colors[id]} : undefined}/>)}
    </g>
    {points.map(({code, country: name, count, x, y, labelSide}) => {
      const radius = (8 + Math.min(7, Math.sqrt(count) * 1.55)) * unit;
      const label = `${name} · ${plural(count, 'contribution')}`;
      const toggle = () => onCountry(country === name ? 'all' : name);
      return <g key={code} data-marker="true" data-country={code} className="presentation-marker thematic-marker"
        role="button" tabIndex="0" aria-label={label} aria-pressed={country === name}
        onClick={toggle} onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggle();
          }
        }}>
        <circle cx={x} cy={y} r={radius + 5 * unit} fill="transparent"/>
        <circle cx={x} cy={y} r={radius} className="thematic-node"/>
        <text x={x} y={y + 4 * unit} className="thematic-count" fontSize={11 * unit}>{count}</text>
        <text x={x + labelSide * (radius + 6 * unit)} y={labelSide === 0 ? y - radius - 4 * unit : y + 4 * unit}
          fontSize={12 * unit} className="thematic-country" strokeWidth={3 * unit}
          textAnchor={labelSide === 0 ? 'middle' : labelSide < 0 ? 'end' : 'start'}>{name}</text>
        <title>{label}</title>
      </g>;
    })}
  </g>;
}

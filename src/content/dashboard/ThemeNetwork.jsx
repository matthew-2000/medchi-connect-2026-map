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

export function ThemeControl({panelRef, theme, onChange, network, compact, highlight}) {
  const overview = theme === 'all';
  const summaryPrefix = overview ? `${plural(network.themeIds.length, 'theme')} · ` : '';
  const summary = network.nodes.length
    ? `${summaryPrefix}${plural(network.count, 'contribution')} · ${network.nodes.length} ${network.nodes.length === 1 ? 'country' : 'countries'}`
    : 'No mapped contributions for this selection.';
  return <section ref={panelRef} className="thematic-control" data-overview={overview} data-compact={compact}
    aria-label="Thematic network" data-reviewed-rows="true">
    <span className="thematic-control-label">Research theme</span>
    <Dropdown label="Research theme" value={theme} choices={themeChoices} choiceLabels={themeLabels}
      allLabel={themeLabels.all} onChange={onChange}/>
    <p role="status">{summary}</p>
    {overview && network.themeIds.length > 0 && <ul className="thematic-legend" aria-label="Themes shown">
      {network.themeIds.map(id => <li key={id}>
        <button type="button" data-theme-origin={id} onClick={() => onChange(id)}
          onMouseEnter={() => highlight(id)} onMouseLeave={() => highlight(null)}
          onFocus={() => highlight(id)} onBlur={() => highlight(null)}>
          <i style={{backgroundColor: colors[id]}} aria-hidden="true"/>{themes[id]}
        </button>
      </li>)}
    </ul>}
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
        const bend = compact ? (startY + y) / 2 : (startX + x) / 2;
        const curve = compact ? `C${startX},${bend} ${x},${bend}` : `C${bend},${startY} ${bend},${y}`;
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
        <text x={x + labelSide * (radius + 6 * unit)} y={y + 4 * unit} fontSize={12 * unit}
          className="thematic-country" strokeWidth={3 * unit} textAnchor={labelSide < 0 ? 'end' : 'start'}>{name}</text>
        <title>{label}</title>
      </g>;
    })}
  </g>;
}

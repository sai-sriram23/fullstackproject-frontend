import React, { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import { languages } from '../constants/languages';

const GlobeSelector = ({ onSelectLanguage, currentLanguage }) => {
  const globeEl = useRef();
  const [countries, setCountries] = useState({ features: [] });
  const [hoverD, setHoverD] = useState();
  const [selectedCountry, setSelectedCountry] = useState(null);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(setCountries);
  }, []);

  const countryLanguageMap = {
    'IND': {
      name: 'India',
      languages: [
        { id: 'hi', name: 'Hindi' },
        { id: 'te', name: 'Telugu' },
        { id: 'ta', name: 'Tamil' },
        { id: 'kn', name: 'Kannada' },
        { id: 'ml', name: 'Malayalam' }
      ],
      provinces: [
        { name: 'Telangana', lang: 'te' },
        { name: 'Tamil Nadu', lang: 'ta' },
        { name: 'Karnataka', lang: 'kn' },
        { name: 'Delhi', lang: 'hi' }
      ]
    },
    'USA': {
      name: 'USA',
      languages: [{ id: 'en', name: 'English' }, { id: 'es', name: 'Spanish' }]
    },
    'CHE': {
      name: 'Switzerland',
      languages: [{ id: 'de', name: 'German' }, { id: 'fr', name: 'French' }, { id: 'it', name: 'Italian' }]
    }
  };

  return (
    <div className="relative w-full h-[650px] bg-slate-900 rounded-[40px] overflow-hidden shadow-2xl border border-slate-700">
      <div className="absolute top-8 left-8 z-20 space-y-2 pointer-events-none">
        <div className="inline-block px-4 py-1.5 bg-blue-600/20 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-600/20 backdrop-blur-md">
          Global Intelligence
        </div>
        <h2 className="text-3xl font-black text-white tracking-tighter">Regional Selector</h2>
      </div>

      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        polygonsData={countries.features}
        polygonAltitude={d => d === hoverD ? 0.06 : 0.01}
        polygonCapColor={d => d === hoverD ? 'rgba(59, 130, 246, 0.6)' : 'rgba(59, 130, 246, 0.15)'}
        polygonSideColor={() => 'rgba(0, 0, 0, 0.2)'}
        polygonStrokeColor={() => '#111'}
        onPolygonHover={setHoverD}
        onPolygonClick={({ properties: d }) => {
          const data = countryLanguageMap[d.ISO_A3];
          if (data) setSelectedCountry(data);
          else setSelectedCountry({ name: d.NAME, languages: [{ id: 'en', name: 'English' }] });
        }}
        enablePointerInteraction={true}
        animateIn={true}
      />

      {selectedCountry && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-30 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-[32px] p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in duration-300">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{selectedCountry.name}</h3>
                <p className="text-slate-500 text-sm font-medium">Select a local language or province</p>
              </div>
              <button onClick={() => setSelectedCountry(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400">✕</button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                {selectedCountry.languages.map(lang => (
                  <button 
                    key={lang.id}
                    onClick={() => { onSelectLanguage(lang.id); setSelectedCountry(null); }}
                    className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-transparent hover:border-blue-500 font-bold transition-all text-sm"
                  >
                    {lang.name}
                  </button>
                ))}
              </div>

              {selectedCountry.provinces && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Specific Provinces</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCountry.provinces.map(p => (
                      <button 
                        key={p.name}
                        onClick={() => { onSelectLanguage(p.lang); setSelectedCountry(null); }}
                        className="px-4 py-2 bg-blue-500/10 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-500 hover:text-white transition-all"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="absolute bottom-8 right-8 z-20 flex gap-4">
        <button 
          onClick={() => globeEl.current.pointOfView({ lat: 20, lng: 78, altitude: 2 }, 1000)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/10 backdrop-blur-md"
        >
          Focus South Asia
        </button>
        <button 
          onClick={() => globeEl.current.pointOfView({ lat: 46, lng: 8, altitude: 2 }, 1000)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/10 backdrop-blur-md"
        >
          Focus Europe
        </button>
      </div>
    </div>
  );
};

export default GlobeSelector;

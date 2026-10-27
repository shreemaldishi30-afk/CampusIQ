(() => {
  const $ = (s) => document.querySelector(s);
  const status = $('#map-status');
  const search = $('#room-search');
  const results = $('#room-results');
  const select = $('#room-select');
  const locateButton = $('#locate-me');
  const directionsButton = $('#open-directions');
  const directory = $('#directory-list');

  // Coordinates reference mapped AB1/AB2 corridors in the community UniNav OSM export.
  // They are building/corridor anchors, NOT exact classroom door coordinates.
  // Replace/add entries after verifying room-to-building/floor data with MUJ.
  const rooms = [
    // CampusIQ destination coordinates are used for available places. These pins are
    // mapped features, NOT guaranteed door coordinates. Indoor room/floor routes still
    // require verified floor plans and stair/lift locations.
    {id:'ab1-101', name:'AB1', roomNumber:'101', building:'Academic Block 1 (AB1)', floor:'Ground / outdoor', type:'Classroom', lat:26.84219, lon:75.56470, pinAccuracy:'approximate'},
    {id:'ab1-204', name:'AB1', roomNumber:'204', building:'Academic Block 1 (AB1)', floor:'Ground / outdoor', type:'Classroom', lat:26.84219, lon:75.56470, pinAccuracy:'approximate'},
    {id:'ab1-lab', name:'AB1 Computer Lab', building:'Academic Block 1 (AB1)', floor:'Ground / outdoor', type:'Lab', lat:26.84219, lon:75.56470, pinAccuracy:'approximate'},
    {id:'ab2-101', name:'AB2', roomNumber:'101', building:'Academic Block 2 (AB2)', floor:'Ground / outdoor', type:'Classroom', lat:26.84270, lon:75.56610, pinAccuracy:'approximate'},
    {id:'ab2-204', name:'AB2', roomNumber:'204', building:'Academic Block 2 (AB2)', floor:'Ground / outdoor', type:'Classroom', lat:26.84270, lon:75.56610, pinAccuracy:'approximate'},
    {id:'ab2-lab', name:'AB2 Computer Lab', building:'Academic Block 2 (AB2)', floor:'Ground / outdoor', type:'Lab', lat:26.84270, lon:75.56610, pinAccuracy:'approximate'},
    {id:'ab1', name:'Academic Block 1 (AB1)', building:'Academic Block 1 (AB1)', floor:'Building', type:'Building', lat:26.84219, lon:75.56470, pinAccuracy:'approximate'},
    {id:'ab2', name:'Academic Block 2 (AB2)', building:'Academic Block 2 (AB2)', floor:'Building', type:'Building', lat:26.84270, lon:75.56610, pinAccuracy:'approximate'},
    {id:'ab3', name:'Academic Block 3 (AB3)', aliases:['AB3'], building:'Academic Block 3', floor:'Building', type:'Building', lat:26.84305, lon:75.56625, pinAccuracy:'approximate'},
    {id:'lhc', name:'Lecture Hall Complex (LHC)', aliases:['LHC','LHC Ground Floor','Lecture Hall Complex'], building:'Lecture Hall Complex, MUJ', floor:'Building', type:'Academic facility', lat:26.84235, lon:75.56595, pinAccuracy:'approximate', source:'CampusIQ map pin'},
    {id:'dome', name:'Dome Building', aliases:['Dome'], building:'Dome Building', floor:'Building', type:'Academic facility', lat:26.84355, lon:75.56585, pinAccuracy:'approximate'},
    {id:'central-library', name:'Central Library', aliases:['Library'], building:'Central Library', floor:'Building', type:'Library', lat:26.84285, lon:75.56515, pinAccuracy:'approximate'},
    {id:'new-library', name:'New Library', aliases:['New Lib'], building:'New Library', floor:'Building', type:'Library', lat:26.84260, lon:75.56545, pinAccuracy:'approximate'},
    {id:'aws-lab', name:'AWS Lab', aliases:['AWS'], building:'AWS Lab', floor:'Building', type:'Lab', lat:26.84235, lon:75.56505, pinAccuracy:'approximate'},
    {id:'mechanical-workshop', name:'Mechanical Workshop', aliases:['Mechanical'], building:'Mechanical Workshop', floor:'Building', type:'Workshop', lat:26.84185, lon:75.56510, pinAccuracy:'approximate'},
    {id:'xrd-lab', name:'XRD Lab', aliases:['XRD'], building:'XRD Laboratory', floor:'Building', type:'Research lab', lat:26.84318, lon:75.56472, pinAccuracy:'approximate'},
    {id:'workshop', name:'Workshop Building', aliases:['Workshop'], building:'Workshop Building', floor:'Building', type:'Workshop', lat:26.84195, lon:75.56435, pinAccuracy:'approximate'},
    {id:'material-science-lab', name:'Material Science Lab (AB1 corridor)', building:'AB1 corridor, mapped building; entrance/room needs confirmation', floor:'Room 318 listed publicly; verify floor', type:'Research lab', lat:26.84319, lon:75.56465, source:'OpenStreetMap mapped building'},
    {id:'sharda-auditorium', name:'Sharda Pai Auditorium', building:'Academic Block 2 corridor', floor:'Building', type:'Auditorium', lat:26.84333, lon:75.56575, source:'OpenStreetMap mapped point'},
    {id:'ramdas-amphitheatre', name:'Ramdas Pai Amphitheatre', aliases:['Ramdas Pai Amphitheatre','Amphitheatre'], building:'Ramdas Pai Amphitheatre', floor:'Outdoor', type:'Event venue', lat:26.84333, lon:75.56575, pinAccuracy:'approximate'},
    {id:'cafeteria', name:'Cafeteria / Food Court', aliases:['Cafeteria','Food Court'], building:'Campus food facilities', floor:'Ground', type:'Food', lat:26.84272, lon:75.56605, pinAccuracy:'approximate'},
    {id:'sports', name:'Sports Complex', aliases:['Sports'], building:'Sports Complex', floor:'Outdoor', type:'Sports', lat:26.84055, lon:75.56745, pinAccuracy:'approximate'},
    {id:'admin', name:'Administration Office', building:'Administrative Block (mapped building; entrance needs confirmation)', floor:'Building', type:'Office', lat:26.84175, lon:75.56589, source:'OpenStreetMap building location'},
    {id:'hostel', name:'Hostel / Residence', aliases:['Hostel','Residence'], building:'Hostel residence area', floor:'Building', type:'Residence', lat:26.84130, lon:75.56285, pinAccuracy:'approximate'},
    {id:'mess', name:'Hostel Mess', aliases:['Hostel Mess','Mess'], building:'Hostel mess area', floor:'Ground', type:'Food', lat:26.84115, lon:75.56235, pinAccuracy:'approximate'},
    {id:'main-gate', name:'MUJ Main Gate', aliases:['Main Gate','Gate'], building:'MUJ Main Gate', floor:'Entrance', type:'Entrance', lat:26.83975, lon:75.56500, pinAccuracy:'approximate'},

    {id:'baba', name:'Baba', aliases:['Baba Cafe','Baba outlet'], building:'Campus food outlets', floor:'Ground', type:'Food / Cafe', lat:26.84122, lon:75.56248, pinAccuracy:'approximate'},
    // Food & cafe directory. Names are included for search/discovery; exact outlet pins
    // should be verified on campus before enabling turn-by-turn routing to each outlet.
    {id:'muj-cafeteria-ab1', name:'001 AB1 (DSW)', aliases:['001','DSW','AB1 DSW'], building:'AB1 / DSW', floor:'Building', type:'Office / Student services', lat:26.84219, lon:75.56470, pinAccuracy:'approximate'},
    {id:'old-food-court', name:'Old Mess', aliases:['Old Mess','Old Food Court'], building:'Old Mess area', floor:'Ground', type:'Food court', lat:26.84172, lon:75.56310, pinAccuracy:'approximate'},
    {id:'munchies', name:'Munchies', building:'Campus food outlets', floor:'Ground', type:'Cafe / Snacks', lat:26.84162, lon:75.56312, pinAccuracy:'approximate'},
    {id:'teapost', name:'GHS', aliases:['GHS','Good Host Spaces','Tea Post'], building:'Good Host Spaces', floor:'Ground', type:'Campus destination', lat:26.8409679, lon:75.5634415, pinAccuracy:'approximate'},
    {id:'saras-campus', name:'Saras Dairy', building:'Campus food outlets', floor:'Verify', type:'Juices / Cafe', lat:26.8408846, lon:75.5632663, pinSource:'CampusIQ destination pin'},
    {id:'nescafe-campus', name:'Nescafe', building:'Campus food outlets', floor:'Ground', type:'Coffee / Cafe', lat:26.84145, lon:75.56310, pinAccuracy:'approximate'},
    {id:'thats-eat', name:"That's Eat", building:'Campus food outlets', floor:'Ground', type:'Food outlet', lat:26.84152, lon:75.56318, pinAccuracy:'approximate'},
    {id:'yumzee-cafe', name:'The Yumzee Cafe (Kulhad Chai Bar)', building:'Near Dr TMA Pai Auditorium / AB2 area', floor:'Verify', type:'Tea / Coffee / Snacks', lat:26.8435327, lon:75.5663963, pinSource:'CampusIQ destination pin'},
    {id:'dialog-cafe', name:'Cafe Dialog', building:'GHS / hostel food zone', floor:'Ground', type:'Cafe / Restaurant', lat:26.84110, lon:75.56250, pinAccuracy:'approximate'},
    {id:'devine-snacks', name:'Devine Snacks', building:'Campus food outlets', floor:'Ground', type:'Snacks / Food court', lat:26.84110, lon:75.56225, pinAccuracy:'approximate'},
    {id:'dev-sweets', name:'Dev Sweets and Snacks', building:'B4 / hostel food zone', floor:'Verify', type:'Bakery / Sweets / Snacks', lat:26.8410957, lon:75.5621607, pinSource:'CampusIQ destination pin'},
    {id:'tea-tradition', name:'Tea Tradition', building:'Hostel food zone', floor:'Verify', type:'Tea / Cafe', lat:26.8410923, lon:75.5619992, pinSource:'CampusIQ destination pin'},
    {id:'amul-cafe', name:'Amul Parlour', building:'Hostel food zone', floor:'Verify', type:'Dairy / Ice cream', lat:26.8409968, lon:75.5635715, pinSource:'CampusIQ destination pin'},
    {id:'tandoor', name:'Tandoor', building:'Hostel food zone', floor:'Verify', type:'Indian food', lat:26.8409554, lon:75.5634372, pinSource:'CampusIQ destination pin'},
    {id:'zaika', name:'Al Zaika Restaurant', building:'MUJ area', floor:'Ground / outdoor', type:'Restaurant / Rolls', lat:26.8365799, lon:75.5644722, pinSource:'CampusIQ destination pin'},
    {id:'burger-farm', name:'Burger Farm', building:'Hostel food zone', floor:'Verify', type:'Burgers / Fast food', lat:26.8414880, lon:75.5632970, pinSource:'CampusIQ destination pin'},
    {id:'mini-meals', name:'Mini Meals', building:'Hostel food zone', floor:'Verify', type:'Shakes / Snacks', lat:26.8417213, lon:75.5630982, pinSource:'CampusIQ destination pin'},
    {id:'taste-of-india', name:'Taste of India', building:'Campus food outlets', floor:'Ground', type:'Restaurant', lat:26.84138, lon:75.56265, pinAccuracy:'approximate'},
    {id:'crazy-chef', name:'The Crazy Chef', building:'Hostel food zone', floor:'Verify', type:'Fast food', lat:26.8416749, lon:75.5626972, pinSource:'CampusIQ destination pin'},
    {id:'chilling-point', name:'Chilling Point', building:'Campus food outlets', floor:'Ground', type:'Ice cream / Drinks', lat:26.84132, lon:75.56278, pinAccuracy:'approximate'},
    {id:'food-court-co', name:'Food Court Monginis', aliases:['Monginis','Food Court'], building:'Campus food court', floor:'Ground', type:'Food court', lat:26.84102, lon:75.56290, pinAccuracy:'approximate'},
    {id:'havmor', name:'Havmor', building:'Campus food outlets', floor:'Ground', type:'Ice cream / Snacks', lat:26.84118, lon:75.56295, pinAccuracy:'approximate'},
    {id:'italian-oven', name:'Italian Oven', building:'Campus food outlets', floor:'Ground', type:'Pizza / Italian', lat:26.84125, lon:75.56285, pinAccuracy:'approximate'},
    {id:'cook-house', name:'Cookhouse', aliases:['Cook House'], building:'Campus food outlets', floor:'Ground', type:'Restaurant', lat:26.84128, lon:75.56258, pinAccuracy:'approximate'},
    {id:'zero-degree-cafe', name:'Zero Degree Cafe', building:'Hostel food zone', floor:'Verify', type:'Cafe / Fast food', lat:26.8409999, lon:75.5630623, pinSource:'CampusIQ destination pin'},
    {id:'jaipur-bakers', name:'Jaipur Bakers', building:'Hostel food zone', floor:'Verify', type:'Bakery', lat:26.8407927, lon:75.5626958, pinSource:'CampusIQ destination pin'},
    {id:'chinatown', name:'China Town', building:'Hostel food zone', floor:'Verify', type:'Chinese food', lat:26.8406519, lon:75.5622193, pinSource:'CampusIQ destination pin'},
    {id:'mystery-machine', name:'Mystery Machine - The Gourmet Cafe', building:'MUJ area', floor:'Verify', type:'Cafe / Restaurant', lat:26.8461421, lon:75.5623827, pinSource:'CampusIQ destination pin'},
    {id:'nothing-before-coffee', name:'NBC', aliases:['Nothing Before Coffee'], building:'Near Wild Garden area', floor:'Ground', type:'Coffee / Cafe', lat:26.84302, lon:75.56292, pinAccuracy:'approximate'},
    {id:'wild-garden', name:'Wild Garden Jaipur', building:'Adjacent to MUJ / food-court area', floor:'Outdoor / verify', type:'Food court / Cafes', lat:26.8430610, lon:75.5629505, pinSource:'CampusIQ destination pin'},
    {id:'crossroads-cafe', name:'CrossRoads Cafe', building:'University Road near MUJ (off-campus)', floor:'Ground / verify', type:'Cafe', lat:26.8376434, lon:75.5688700, pinSource:'CampusIQ destination pin'},
    {id:'kumawat-paratha', name:'Kumawat Paratha Junction', building:'University Road near MUJ (off-campus)', floor:'Ground / verify', type:'Vegetarian restaurant', lat:26.8378314, lon:75.5649076, pinSource:'CampusIQ destination pin'},
    {id:'stoa-cafe', name:'Stoa', building:'MUJ area', floor:'Ground / verify', type:'Cafe / Restaurant', lat:26.8346766, lon:75.5636506, pinSource:'CampusIQ destination pin'},
    {id:'highland', name:'Highland', aliases:['Highland Road'], building:'Highland area', floor:'Ground', type:'Restaurant / Cafe', lat:26.8479387, lon:75.5612689, pinAccuracy:'approximate'},
    {id:'janak', name:'Janak Ki Thadi', building:'MUJ area', floor:'Ground / verify', type:'Food / Cafe', lat:26.8460538, lon:75.5620833, pinSource:'CampusIQ destination pin'},
    {id:'belgian-waffle-muj', name:'The Belgian Waffle Co. (near MUJ Hostel)', building:'Near MUJ', floor:'Ground / verify', type:'Waffles / Desserts', lat:26.8434451, lon:75.5632422, pinSource:'CampusIQ destination pin'},
    {id:'bunk-and-brew', name:'Brew & Bunk Cafe', building:'Wild Garden area near MUJ', floor:'Ground / verify', type:'Cafe / Beverages / Food', lat:26.8383849, lon:75.5651108, pinSource:'CampusIQ destination pin'},
    // Additional CampusIQ destination pins.
    {id:'chatkara', name:'Chatkara', building:'MUJ area', floor:'Ground / outdoor', type:'Restaurant', lat:26.8416267, lon:75.5630646, pinSource:'CampusIQ destination pin'},
    {id:'subway-muj', name:'Subway – Manipal University Jaipur', building:'MUJ area', floor:'Ground / outdoor', type:'Sandwiches / Fast food', lat:26.8414983, lon:75.5631649, pinSource:'CampusIQ destination pin'},
    {id:'pizza-bakers', name:"Pizza Baker's", building:'MUJ area', floor:'Ground / outdoor', type:'Pizza / Fast food', lat:26.8414694, lon:75.5631308, pinSource:'CampusIQ destination pin'},
    {id:'brew-and-flame', name:'Brew and Flame', building:'MUJ area', floor:'Ground / outdoor', type:'Cafe', lat:26.8434360, lon:75.5632551, pinSource:'CampusIQ destination pin'},
    {id:'all-mart', name:'All Mart', building:'MUJ area', floor:'Ground / outdoor', type:'Convenience store', lat:26.8416634, lon:75.5630883, pinSource:'CampusIQ destination pin'},
    {id:'rollin-kitchen', name:"The Rollin' Kitchen", building:'Wild Garden area near MUJ', floor:'Ground / outdoor', type:'Restaurant', lat:26.8434294, lon:75.5631769, pinSource:'CampusIQ destination pin'},
    {id:'black-pearl-rental', name:'The Black Pearl Self Drive Car Rental Jaipur', building:'MUJ area', floor:'Ground / outdoor', type:'Car rental', lat:26.8385568, lon:75.5650040, pinSource:'CampusIQ destination pin'},
    {id:'highland-road-pin', name:'Highland Road pin (not verified as restaurant entrance)', building:'Road reference near MUJ', floor:'Outdoor road pin', type:'Road reference only', lat:26.8479387, lon:75.5612689, pinSource:'CampusIQ destination pin', pinAccuracy:'road-reference'},
    {id:'mangal-chai-ghar', name:'Mangal Chai Ghar', building:'Near Wild Garden', floor:'Ground', type:'Tea store', lat:26.84308, lon:75.56288, pinAccuracy:'approximate'}

  ];
  let selected = null;
  let origin = null;
  let originMarker = null;
  let destinationMarker = null;

  const map = L.map('campus-map').setView([26.84255, 75.56535], 17);
  // Import the user's Overpass Turbo GeoJSON: outdoor paths plus mapped indoor corridors,
  // stairs and elevator footprints. OSM coordinates are [longitude, latitude].
  let campusGeoJSON = null;
  let campusPathLayer = null;
  let localWalkGraph = null;
  const geoJSONReady = fetch('/export.geojson').then(r => {
    if (!r.ok) throw new Error('Could not load public/export.geojson');
    return r.json();
  }).then(data => {
    campusGeoJSON = data;
    campusPathLayer = L.geoJSON(data, {
      filter: f => {
        const g = f.geometry?.type, p = f.properties || {};
        return ((g === 'LineString' || g === 'MultiLineString') && !!p.highway) || (g === 'Polygon' && p.highway === 'elevator');
      },
      style: f => {
        const p = f.properties || {}, elevator = p.highway === 'elevator';
        return {
          color: elevator ? '#6f4b32' : (p.indoor === 'yes' || /corridor/i.test(p.name || '') ? '#9a704e' : '#b7a18a'),
          weight: elevator ? 2 : (p.indoor === 'yes' || /corridor/i.test(p.name || '') ? 3 : 2),
          opacity: .82,
          fillColor: '#b58b68', fillOpacity: elevator ? .42 : 0,
          dashArray: p.highway === 'steps' ? '5 4' : null
        };
      },
      onEachFeature: (f, layer) => {
        const p = f.properties || {};
        const label = [p.name, p.highway === 'elevator' ? 'Elevator footprint' : p.highway, p.level ? `Level ${p.level}` : '', p.wheelchair === 'yes' ? 'Wheelchair accessible' : '', p['@id'] || ''].filter(Boolean).join(' · ');
        if (label) layer.bindPopup(label);
      }
    }).addTo(map);
    localWalkGraph = buildWalkGraph(data);
    const vertexCount = (coords) => Array.isArray(coords) ? (typeof coords[0] === 'number' ? 1 : coords.reduce((n, child) => n + vertexCount(child), 0)) : 0;
    const vertices = (data.features || []).reduce((n, f) => n + vertexCount(f.geometry?.coordinates), 0);
    const lineCount = (data.features || []).filter(f => ['LineString','MultiLineString'].includes(f.geometry?.type)).length;
    const elevatorCount = (data.features || []).filter(f => f.geometry?.type === 'Polygon' && f.properties?.highway === 'elevator').length;
    status.textContent = 'Campus map ready. Select a destination and use your location to estimate your walk.';
    return data;
  }).catch(err => {
    console.warn('Campus GeoJSON not loaded:', err);
    status.textContent = 'Campus map loaded, but some walking paths could not be imported. Walking routes may be limited.';
    return null;
  });

  function buildWalkGraph(data) {
    const nodes = [], lookup = new Map(), edges = [];
    const keyOf = c => `${Number(c[0]).toFixed(6)},${Number(c[1]).toFixed(6)}`;
    const nodeFor = c => {
      const key = keyOf(c);
      if (lookup.has(key)) return lookup.get(key);
      const id = nodes.length;
      nodes.push({id, lon:Number(c[0]), lat:Number(c[1]), key, props:null});
      lookup.set(key,id); return id;
    };
    const addLine = (coords, props) => {
      if (!Array.isArray(coords) || coords.length < 2) return;
      // Avoid routing on major roads unless explicitly mapped as foot/pedestrian paths.
      const highway = props?.highway;
      const allowed = ['path','footway','pedestrian','steps','service','residential','tertiary','unclassified','living_street','track','cycleway'];
      if (!allowed.includes(highway)) return;
      for (let i=1;i<coords.length;i++) {
        const a=nodeFor(coords[i-1]), b=nodeFor(coords[i]);
        if (a===b) continue;
        const dist=geoDistance(nodes[a],nodes[b]);
        if (dist > 120) continue; // don't bridge large gaps in the source data
        edges.push({a,b,dist,highway,name:props?.name||'',level:props?.level||props?.layer||'',wheelchair:props?.wheelchair==='yes', indoor:props?.indoor==='yes'});
      }
    };
    for (const f of data.features||[]) {
      const g=f.geometry, props=f.properties||{};
      if (g?.type==='LineString') addLine(g.coordinates,props);
      if (g?.type==='MultiLineString') g.coordinates.forEach(line=>addLine(line,props));
    }
    const adj=nodes.map(()=>[]);
    edges.forEach((e,i)=>{adj[e.a].push({to:e.b,edge:i,cost:e.dist});adj[e.b].push({to:e.a,edge:i,cost:e.dist});});
    return {nodes,edges,adj};
  }
  function geoDistance(a,b) {
    const rad=v=>v*Math.PI/180, R=6371000;
    const dLat=rad(b.lat-a.lat), dLon=rad(b.lon-a.lon);
    const q=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLon/2)**2;
    return 2*R*Math.asin(Math.sqrt(q));
  }
  function localGeoJSONRoute(start,end) {
    const g=localWalkGraph;
    if (!g || !g.nodes.length) throw new Error('Campus path graph is not loaded');
    const nearest = point => {
      let best=-1, d=Infinity;
      g.nodes.forEach(n=>{const x=geoDistance(point,n); if(x<d){d=x;best=n.id;}});
      if (d>180) throw new Error('Your start or destination is too far from a mapped path. Tap a point on a mapped campus path.');
      return best;
    };
    const src=nearest(start), dst=nearest(end), N=g.nodes.length;
    const dist=new Float64Array(N); dist.fill(Infinity); dist[src]=0;
    const prev=new Int32Array(N); prev.fill(-1); const prevEdge=new Int32Array(N); prevEdge.fill(-1);
    const used=new Uint8Array(N);
    // O(V^2) Dijkstra is fine for this small campus export (~1.3k vertices).
    for(let it=0;it<N;it++){
      let u=-1, best=Infinity;
      for(let i=0;i<N;i++) if(!used[i]&&dist[i]<best){best=dist[i];u=i;}
      if(u<0||u===dst) break;
      used[u]=1;
      for(const e of g.adj[u]) if(!used[e.to]&&dist[u]+e.cost<dist[e.to]){dist[e.to]=dist[u]+e.cost;prev[e.to]=u;prevEdge[e.to]=e.edge;}
    }
    if(!Number.isFinite(dist[dst])) throw new Error('No connected walking path found in the supplied GeoJSON between these points.');
    const ids=[]; for(let v=dst;v!==-1;v=prev[v]){ids.push(v);if(v===src)break;} ids.reverse();
    if(ids[0]!==src) throw new Error('The mapped paths do not connect these locations.');
    const coords=[[start.lat,start.lon],...ids.map(i=>[g.nodes[i].lat,g.nodes[i].lon]),[end.lat,end.lon]];
    let total=0; for(let i=1;i<coords.length;i++) total+=geoDistance({lat:coords[i-1][0],lon:coords[i-1][1]},{lat:coords[i][0],lon:coords[i][1]});
    const steps=[];
    for(let i=1;i<ids.length;i++){
      const edge=g.edges[prevEdge[ids[i]]];
      const node=g.nodes[ids[i]];
      steps.push({distance:edge.dist,name:edge.name,maneuver:{type:i===1?'depart':'continue',modifier:'straight',location:[node.lon,node.lat]},_instruction:`${edge.highway==='steps'?'Use the mapped steps':edge.highway==='elevator'?'Use the mapped elevator':'Continue'}${edge.name?` along ${edge.name}`:''} for ${Math.round(edge.dist)} metres${edge.level?` (level ${edge.level})`:''}`});
    }
    steps.push({distance:0,name:'',maneuver:{type:'arrive',modifier:'straight',location:[end.lon,end.lat]},_instruction:'You have arrived at the selected map point'});
    return {distance:total,duration:total/1.2,geometry:{coordinates:coords.map(([lat,lon])=>[lon,lat])},legs:[{steps}],_localGeoJSON:true};
  }
  window.campusIQMap = map;
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 20,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'
  }).addTo(map);

  const estimateBox = $('#destination-estimate');
  function clockTime(date) {
    return date.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'});
  }
  function showDestinationEstimate(room) {
    if (!estimateBox) return;
    estimateBox.replaceChildren();
    estimateBox.hidden = false;
    const title = document.createElement('strong');
    title.textContent = 'Distance & estimated arrival';
    estimateBox.appendChild(title);
    if (!origin) {
      const message = document.createElement('p');
      message.textContent = 'Select “Use my location” to estimate walking distance and arrival time.';
      estimateBox.appendChild(message);
      return;
    }
    if (!Number.isFinite(room.lat) || !Number.isFinite(room.lon)) {
      const message = document.createElement('p');
      message.textContent = 'This destination needs a verified map pin before distance and arrival can be estimated.';
      estimateBox.appendChild(message);
      return;
    }
    const straightLine = geoDistance(origin, {lat:room.lat, lon:room.lon});
    const approximateWalkMeters = straightLine * 1.25;
    const minutes = Math.max(1, Math.ceil(approximateWalkMeters / 1.2 / 60));
    const arrival = new Date(Date.now() + minutes * 60000);
    const metrics = document.createElement('div');
    metrics.className = 'estimate-metrics';
    [[formatDistance(approximateWalkMeters), 'Approx. walking distance'], [`${minutes} min`, 'Approx. walking time'], [clockTime(arrival), 'Estimated arrival']].forEach(([value,label]) => {
      const item = document.createElement('div'); item.className = 'estimate-metric';
      const strong = document.createElement('strong'); strong.textContent = value;
      const small = document.createElement('small'); small.textContent = label;
      item.append(strong,small); metrics.appendChild(item);
    });
    estimateBox.appendChild(metrics);
    const note = document.createElement('p');
    note.textContent = 'Preliminary estimate from straight-line distance, not a routed path. Choose Walking directions for route-based distance and ETA.';
    estimateBox.appendChild(note);
  }

  const campusIQPin = L.divIcon({
    className: 'campusiq-map-pin-wrapper',
    html: '<span class="campusiq-map-pin"><span></span></span>',
    iconSize: [24, 34],
    iconAnchor: [12, 32],
    popupAnchor: [0, -30]
  });

  function selectRoom(room) {
    selected = room;
    select.value = room.id;
    search.value = room.name;
    results.replaceChildren();
    directionsButton.disabled = false;
    if (destinationMarker) { map.removeLayer(destinationMarker); destinationMarker = null; }
    if (Number.isFinite(room.lat) && Number.isFinite(room.lon)) {
      destinationMarker = L.marker([room.lat, room.lon], {icon: campusIQPin}).addTo(map)
        .bindPopup(`<strong>${room.name}${room.roomNumber ? ` · Room ${room.roomNumber}` : ''}</strong><br>${room.building || 'CampusIQ destination'}<br><small>${room.pinAccuracy === 'approximate' ? 'CampusIQ map pin' : 'CampusIQ destination pin'}</small>`)
        .openPopup();
      map.setView([room.lat, room.lon], 19);
      status.textContent = room.outsideCampus
        ? `${room.name} selected on the CampusIQ map.`
        : room.pinAccuracy === 'road-reference'
          ? `${room.name} selected on the CampusIQ map.`
          : room.pinAccuracy === 'approximate'
            ? `${room.name} selected on the CampusIQ map.`
            : `${room.name} selected on the CampusIQ map. You can request in-app walking directions.`;
    } else {
      status.textContent = `${room.name}${room.roomNumber ? ` · Room ${room.roomNumber}` : ''} selected. This destination is not available on the map yet.`;
    }
    showDestinationEstimate(room);
  }

  function roomCard(room, compact=false) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = compact ? 'room-result' : 'directory-item';
    b.setAttribute('role', compact ? 'option' : 'listitem');
    const name = document.createElement('strong'); name.textContent = room.name;
    const clean = (value) => String(value || '')
      .replace(/\s*\([^)]*verify[^)]*\)/ig, '')
      .replace(/\bverify exact location\b/ig, '')
      .replace(/\bverify exact entrance\b/ig, '')
      .replace(/\bverify\b/ig, '')
      .replace(/\s{2,}/g, ' ').trim();
    const detail = document.createElement('span');
    detail.textContent = [clean(room.building), clean(room.floor)].filter(Boolean).join(' · ');
    // Only render a room-number field for entries that actually have a room number.
    // General destinations (cafes, libraries, gates, hostels, labs, etc.) should not
    // display a meaningless “Room number: —” badge.
    const parts = [name, detail];
    if (room.roomNumber !== undefined && room.roomNumber !== null && String(room.roomNumber).trim() !== '') {
      const roomNumber = document.createElement('span');
      roomNumber.className = 'directory-room-number';
      roomNumber.textContent = `Room number: ${room.roomNumber}`;
      roomNumber.setAttribute('aria-label', `Room number ${room.roomNumber}`);
      parts.push(roomNumber);
    }
    const kind = document.createElement('small');
    kind.textContent = room.outsideCampus ? `${room.type} · outside MUJ map area` : room.pinAccuracy === 'road-reference' ? `${room.type} · road reference only` : room.type;
    parts.push(kind);
    b.append(...parts);
    b.addEventListener('click', () => selectRoom(room));
    return b;
  }

  // Draw destination names directly over the map surface with no dots, icons,
  // boxes, or permanent popup labels. This is a canvas label layer styled to blend
  // into the existing basemap; it redraws as the map pans and zooms.
  const destinationLabelRooms = rooms.filter(room =>
    Number.isFinite(room.lat) && Number.isFinite(room.lon) &&
    !room.outsideCampus && room.pinAccuracy !== 'road-reference'
  );
  const DestinationLabelLayer = L.Layer.extend({
    onAdd: function(mapInstance) {
      this._map = mapInstance;
      this._canvas = L.DomUtil.create('canvas', 'campusiq-engraved-label-layer');
      this._canvas.style.position = 'absolute';
      this._canvas.style.pointerEvents = 'none';
      this._canvas.style.zIndex = '450';
      mapInstance.getPanes().overlayPane.appendChild(this._canvas);
      mapInstance.on('moveend zoomend resize', this._reset, this);
      this._reset();
    },
    onRemove: function(mapInstance) {
      mapInstance.off('moveend zoomend resize', this._reset, this);
      if (this._canvas && this._canvas.parentNode) this._canvas.parentNode.removeChild(this._canvas);
    },
    _reset: function() {
      const mapInstance = this._map;
      if (!mapInstance || !this._canvas) return;
      const size = mapInstance.getSize();
      const topLeft = mapInstance.containerPointToLayerPoint([0, 0]);
      L.DomUtil.setPosition(this._canvas, topLeft);
      const canvas = this._canvas;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(size.x * ratio);
      canvas.height = Math.round(size.y * ratio);
      canvas.style.width = size.x + 'px';
      canvas.style.height = size.y + 'px';
      const ctx = canvas.getContext('2d');
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, size.x, size.y);
      const zoom = mapInstance.getZoom();
      if (zoom < 17) return;
      const used = [];
      destinationLabelRooms.forEach(room => {
        const p = mapInstance.latLngToContainerPoint([room.lat, room.lon]);
        if (p.x < -120 || p.x > size.x + 120 || p.y < -30 || p.y > size.y + 30) return;
        const label = room.name || '';
        if (!label) return;
        const fontSize = zoom >= 19 ? 12 : zoom === 18 ? 11 : 10;
        ctx.font = `600 ${fontSize}px Arial, sans-serif`;
        const width = ctx.measureText(label).width;
        const box = {x:p.x, y:p.y, w:width, h:fontSize+4};
        // Avoid dense label collisions rather than covering other map details.
        if (used.some(r => Math.abs(r.x-box.x) < (r.w+box.w)*0.45 && Math.abs(r.y-box.y) < (r.h+box.h)*0.8)) return;
        used.push(box);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        // A narrow map-like halo keeps text legible over paths without a label box.
        ctx.lineWidth = 2.6;
        ctx.strokeStyle = 'rgba(255, 253, 230, 0.88)';
        ctx.strokeText(label, p.x + 4, p.y);
        ctx.fillStyle = '#6d5b4b';
        ctx.fillText(label, p.x + 4, p.y);
      });
    }
  });
  // Populate the destination dropdown and directory. This loop was accidentally
  // omitted when the custom marker layer was replaced with the engraved-label canvas.
  rooms.forEach(room => {
    const option = document.createElement('option');
    option.value = room.id;
    option.textContent = room.id === 'teapost' ? 'GHS' : `${room.name}${room.roomNumber ? ` · Room ${room.roomNumber}` : ''} — ${room.building}`;
    select.appendChild(option);
    directory.appendChild(roomCard(room));
  });

  const destinationLabelLayer = new DestinationLabelLayer();
  destinationLabelLayer.addTo(map);
  // Clicking a location through the directory/dropdown remains the primary selection
  // mechanism; labels themselves are deliberately not interactive.

  function renderResults(query) {
    results.replaceChildren();
    const q = query.trim().toLowerCase();
    if (!q) return;
    const matches = rooms.filter(r => `${r.name} ${(r.aliases || []).join(' ')} ${r.roomNumber || ''} ${r.building} ${r.floor} ${r.type}`.toLowerCase().includes(q)).slice(0, 7);
    if (!matches.length) {
      const p = document.createElement('p'); p.className = 'no-results';
      p.textContent = 'No room code found in the starter directory. Add the verified room, block, floor and coordinates to rooms in public/realmap.js.';
      results.appendChild(p); return;
    }
    matches.forEach(r => results.appendChild(roomCard(r, true)));
  }
  search.addEventListener('input', () => renderResults(search.value));
  select.addEventListener('change', () => { const room = rooms.find(r => r.id === select.value); if (room) selectRoom(room); });

  locateButton.addEventListener('click', () => {
    if (!navigator.geolocation) { status.textContent = 'This browser does not support location. You can still select a classroom and open directions.'; return; }
    status.textContent = 'Requesting your location…';
    navigator.geolocation.getCurrentPosition(pos => {
      origin = {lat:pos.coords.latitude, lon:pos.coords.longitude};
      if (originMarker) map.removeLayer(originMarker);
      originMarker = L.circleMarker([origin.lat, origin.lon], {radius:8,color:'#fff',weight:3,fillColor:'#1677ff',fillOpacity:1}).addTo(map).bindPopup('Your current location').openPopup();
      map.setView([origin.lat, origin.lon], 18);
      status.textContent = `Location found (reported accuracy about ${Math.round(pos.coords.accuracy || 0)} m). Indoor GPS can be inaccurate.`;
      if (selected) {
        showDestinationEstimate(selected);
        // If a destination was already selected, continue straight to directions
        // once the browser has supplied the user's starting coordinates.
        drawInAppDirections();
      }
    }, err => {
      status.textContent = err.code === 1
        ? 'Destination is selected, but location access was denied. Allow location in your browser, then click Walking directions.'
        : 'Destination is selected, but your starting location could not be found. Try again outdoors, or click Walking directions after setting your location.';
    }, {enableHighAccuracy:true, timeout:12000, maximumAge:15000});
  });

  let routeLine = null;
  let routeStartMarker = null;
  let routeInstructions = null;
  let routeDestinationMarker = null;

  function decodePolyline(encoded, precision=5) {
    let index=0, lat=0, lon=0; const out=[]; const factor=10**precision;
    while(index<encoded.length) {
      let result=0, shift=0, b;
      do { b=encoded.charCodeAt(index++)-63; result|=(b&0x1f)<<shift; shift+=5; } while(b>=0x20 && index<encoded.length);
      lat += (result&1) ? ~(result>>1) : (result>>1);
      result=0; shift=0;
      do { b=encoded.charCodeAt(index++)-63; result|=(b&0x1f)<<shift; shift+=5; } while(b>=0x20 && index<encoded.length);
      lon += (result&1) ? ~(result>>1) : (result>>1);
      out.push([lat/factor,lon/factor]);
    }
    return out;
  }
  function valhallaType(type) {
    return ({1:'depart',2:'turn',3:'turn',4:'turn',5:'turn',6:'turn',7:'continue',8:'continue',9:'arrive',10:'roundabout',11:'merge',12:'fork',13:'end of road'})[type] || 'continue';
  }
  function valhallaModifier(m) {
    const t=(m.instruction||'').toLowerCase();
    if(t.includes('left')) return 'left'; if(t.includes('right')) return 'right';
    if(t.includes('u-turn')) return 'uturn'; return 'straight';
  }

  function formatDistance(meters) {
    if (!Number.isFinite(meters)) return '';
    return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(2)} km`;
  }

  function describeManeuver(step, index) {
    const m = step.maneuver || {};
    const modifier = (m.modifier || '').replace(/_/g, ' ');
    const road = step.name ? ` onto ${step.name}` : '';
    if (m.type === 'depart') return `Start walking${modifier ? ` ${modifier}` : ''}${road}`;
    if (m.type === 'arrive') return 'You have arrived at your destination';
    if (m.type === 'turn') return `Turn ${modifier || 'as indicated'}${road}`;
    if (m.type === 'continue' || m.type === 'new name' || m.type === 'notification') return `Continue${modifier ? ` ${modifier}` : ' straight'}${road}`;
    if (m.type === 'end of road') return `At the end of the path, turn ${modifier || 'as indicated'}${road}`;
    if (m.type === 'fork') return `At the fork, keep ${modifier || 'straight'}${road}`;
    if (m.type === 'roundabout' || m.type === 'rotary' || m.type === 'roundabout turn') {
      const exit = m.exit ? ` and take exit ${m.exit}` : '';
      return `At the roundabout, continue${exit}${road}`;
    }
    if (m.type === 'merge') return `Merge ${modifier || ''}${road}`.trim();
    if (m.type === 'on ramp') return `Take the ramp${road}`;
    if (m.type === 'off ramp') return `Take the exit${road}`;
    if (m.type === 'use lane') return `Follow the indicated lane${road}`;
    return `${index === 0 ? 'Start walking' : 'Continue walking'}${road}`;
  }

  function clearPreviousRoute() {
    if (routeLine) map.removeLayer(routeLine);
    if (routeStartMarker) map.removeLayer(routeStartMarker);
    if (routeDestinationMarker) map.removeLayer(routeDestinationMarker);
    if (routeInstructions) routeInstructions.remove();
    routeLine = routeStartMarker = routeDestinationMarker = routeInstructions = null;
  }

  async function drawInAppDirections() {
    if (!selected) {
      status.textContent = 'First search for and select a classroom or building.';
      return;
    }
    // If a directory entry has no coordinates, try finding a matching public OSM place.
    // Never silently pretend a result is an exact room/door: public geocoding usually returns a building/POI.
    if (!Number.isFinite(selected.lat) || !Number.isFinite(selected.lon)) {
      status.textContent = `Looking for a mapped location for ${selected.name}…`;
      try {
        const q = encodeURIComponent(`${selected.name}, Manipal University Jaipur, Rajasthan, India`);
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${q}`, {headers:{'Accept':'application/json'}});
        if (!response.ok) throw new Error('Map search is temporarily unavailable');
        const matches = await response.json();
        const campusMatch = matches.find(x => {
          const lat = Number(x.lat), lon = Number(x.lon);
          return Number.isFinite(lat) && Number.isFinite(lon) && lat > 26.82 && lat < 26.86 && lon > 75.54 && lon < 75.59;
        });
        if (!campusMatch) throw new Error('No matching mapped location found. Tap the destination on the map to set its coordinates.');
        selected = {...selected, lat:Number(campusMatch.lat), lon:Number(campusMatch.lon), geocoded:true};
        status.textContent = `Found a public map point for ${selected.name}. This may be the building or business location, not its exact entrance.`;
      } catch (error) {
        status.textContent = `The destination is selected, but directions could not be calculated: ${error.message}. Check your internet connection and try Walking directions again.`;
        return;
      }
    }
    if (!origin) {
      status.textContent = 'First click “Use my location” so CampusIQ knows your starting point.';
      return;
    }
    if (haversineMeters(origin, {lat:selected.lat, lon:selected.lon}) < 8) {
      status.textContent = 'You appear to be at the destination or its approximate pin. Select the correct building entrance if needed.';
      return;
    }

    clearPreviousRoute();
    directionsButton.disabled = true;
    directionsButton.textContent = 'Finding walking route…';
    status.textContent = 'Calculating a pedestrian route from OpenStreetMap…';
    try {
      // FOSSGIS OSRM foot profile. Route stays on this website; no Google Maps redirect.
      const coords = `${origin.lon},${origin.lat};${selected.lon},${selected.lat}`;
      const url = `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${coords}?steps=true&overview=full&geometries=geojson&alternatives=false`;
      let route = null;
      let coordinates = null;
      let routingNote = 'Route calculated from OpenStreetMap pedestrian data.';
      // Try the public foot-routing instance first.
      try {
        const response = await fetch(url, {headers: {'Accept':'application/json'}});
        if (!response.ok) throw new Error(`Foot router returned ${response.status}`);
        const data = await response.json();
        if (data.code !== 'Ok' || !data.routes || !data.routes.length) throw new Error('No route from foot router');
        route = data.routes[0];
        coordinates = route.geometry.coordinates.map(([lon,lat]) => [lat,lon]);
      } catch (footError) {
        // Fallback to the public Valhalla pedestrian router, which returns manoeuvre steps.
        const payload = {locations:[{lat:origin.lat,lon:origin.lon},{lat:selected.lat,lon:selected.lon}], costing:'pedestrian', directions_options:{units:'kilometers'}};
        try {
          const fallback = await fetch(`https://valhalla1.openstreetmap.de/route?json=${encodeURIComponent(JSON.stringify(payload))}`);
          if (!fallback.ok) throw new Error('Valhalla unavailable');
          const vd = await fallback.json();
          if (vd.error || !vd.trip || !vd.trip.legs?.length) throw new Error(vd.error || 'No pedestrian route exists in mapped data.');
          const leg = vd.trip.legs[0];
          const decoded = decodePolyline(leg.shape, 6);
          coordinates = decoded.map(([lat,lon]) => [lat,lon]);
          const maneuvers = leg.maneuvers || [];
          const steps = maneuvers.map(m => ({distance:(m.length||0)*1000, name:m.street_names?.[0]||'', maneuver:{type:valhallaType(m.type), modifier:valhallaModifier(m), location:[m.begin_shape_index < decoded.length ? decoded[m.begin_shape_index][1] : origin.lon, m.begin_shape_index < decoded.length ? decoded[m.begin_shape_index][0] : origin.lat]}, _instruction:m.instruction}));
          route = {distance:(vd.trip.summary?.length||0)*1000, duration:vd.trip.summary?.time||0, geometry:{coordinates:coordinates.map(([lat,lon])=>[lon,lat])}, legs:[{steps}]};
          routingNote = 'Route calculated using OpenStreetMap pedestrian routing. Distances and paths depend on mapped data.';
        } catch (valhallaError) {
          await geoJSONReady;
          route = localGeoJSONRoute(origin, selected);
          coordinates = route.geometry.coordinates.map(([lon,lat]) => [lat,lon]);
          routingNote = 'Route calculated from the supplied campus export.geojson path network. Routes are only as accurate as mapped path connectivity; indoor levels and elevator polygons may not be fully connected.';
        }
      }
      routeLine = L.polyline(coordinates, {color:'#805638', weight:6, opacity:.92, lineCap:'round', lineJoin:'round'}).addTo(map);
      routeStartMarker = L.circleMarker([origin.lat, origin.lon], {radius:8,color:'#fff',weight:3,fillColor:'#805638',fillOpacity:1}).addTo(map).bindPopup('Your starting location');
      routeDestinationMarker = L.marker([selected.lat, selected.lon]).addTo(map).bindPopup(`<strong>${selected.name}</strong><br>Destination pin may be approximate`);
      map.fitBounds(routeLine.getBounds(), {padding:[36,36]});

      const panel = document.createElement('section');
      panel.className = 'inapp-directions';
      panel.setAttribute('aria-label', 'Turn-by-turn walking directions');
      const heading = document.createElement('div'); heading.className = 'directions-panel-heading';
      const title = document.createElement('strong'); title.textContent = 'Your walking directions';
      const summary = document.createElement('span');
      summary.className = 'directions-summary';
      const routeMinutes = Math.max(1, Math.ceil(route.duration / 60));
      const routeArrival = clockTime(new Date(Date.now() + routeMinutes * 60000));
      summary.textContent = `${formatDistance(route.distance)} · about ${routeMinutes} min · ETA ${routeArrival} · ${selected.name}`;
      if (estimateBox) {
        estimateBox.replaceChildren(); estimateBox.hidden = false;
        const estimateTitle = document.createElement('strong'); estimateTitle.textContent = 'Walking route estimate';
        const estimateMetrics = document.createElement('div'); estimateMetrics.className = 'estimate-metrics';
        [[formatDistance(route.distance), 'Route distance'], [`${routeMinutes} min`, 'Walking time'], [routeArrival, 'Estimated arrival']].forEach(([value,label]) => { const item=document.createElement('div'); item.className='estimate-metric'; const strong=document.createElement('strong'); strong.textContent=value; const small=document.createElement('small'); small.textContent=label; item.append(strong,small); estimateMetrics.appendChild(item); });
        estimateBox.append(estimateTitle, estimateMetrics);
      }
      heading.append(title, summary); panel.appendChild(heading);
      const disclaimer = document.createElement('p');
      disclaimer.className = 'directions-disclaimer';
      disclaimer.textContent = `${routingNote} Building pins may not be exact entrances; classroom interiors, stairs, lifts and indoor floor connections are not mapped.`;
      panel.appendChild(disclaimer);

      const stepsList = document.createElement('ol'); stepsList.className = 'turn-steps';
      const legs = route.legs || [];
      const steps = legs.flatMap(leg => leg.steps || []);
      steps.forEach((step, index) => {
        // Hide tiny notification-only segments to keep instructions readable.
        if ((step.distance || 0) < 2 && !['depart','arrive','turn','roundabout','rotary','fork','end of road'].includes(step.maneuver?.type)) return;
        const item = document.createElement('li');
        const icon = document.createElement('span'); icon.className = 'turn-step-icon';
        const type = step.maneuver?.type || '';
        const modifier = step.maneuver?.modifier || '';
        icon.textContent = type === 'arrive' ? '●' : type === 'depart' ? '↑' : modifier.includes('left') ? '↰' : modifier.includes('right') ? '↱' : type.includes('roundabout') ? '⟳' : '↑';
        const copy = document.createElement('div'); copy.className = 'turn-step-copy';
        const instruction = document.createElement('strong'); instruction.textContent = step._instruction || describeManeuver(step, index);
        const distance = document.createElement('small'); distance.textContent = step.distance >= 2 ? `Walk ${formatDistance(step.distance)}` : (type === 'arrive' ? 'Destination reached' : '');
        copy.append(instruction, distance); item.append(icon, copy);
        item.addEventListener('click', () => {
          const loc = step.maneuver?.location;
          if (loc) map.panTo([loc[1], loc[0]]);
        });
        stepsList.appendChild(item);
      });
      if (!stepsList.children.length) {
        const item = document.createElement('li'); item.textContent = 'Follow the highlighted walking route to your destination.'; stepsList.appendChild(item);
      }
      panel.appendChild(stepsList);
      const mapEl = $('#campus-map'); mapEl.insertAdjacentElement('afterend', panel);
      routeInstructions = {remove: () => panel.remove()};
      status.textContent = 'Walking route ready. Follow the numbered instructions below the map.';
    } catch (error) {
      status.textContent = `Could not calculate a walking route: ${error.message} Check your connection or try another mapped destination. No straight-line route has been shown.`;
    } finally {
      directionsButton.disabled = false;
      directionsButton.textContent = 'Walking directions';
    }
  }

  function haversineMeters(a, b) {
    const rad = v => v * Math.PI / 180;
    const R = 6371000;
    const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
    const x = Math.sin(dLat/2)**2 + Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLon/2)**2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }

  // Tap-to-identify: any map tap drops a pin and reports coordinates.
  let tappedPin = null;
  map.on('click', (event) => {
    const {lat, lng} = event.latlng;
    if (tappedPin) map.removeLayer(tappedPin);
    tappedPin = L.marker([lat, lng]).addTo(map);
    tappedPin.bindPopup(`<strong>Selected map point</strong><br>Latitude: ${lat.toFixed(6)}<br>Longitude: ${lng.toFixed(6)}<br><button type="button" id="use-tap-destination">Use as destination</button>`).openPopup();
    status.textContent = `Selected point: ${lat.toFixed(6)}, ${lng.toFixed(6)}. Coordinates copied into the map pin.`;
    map.once('popupopen', () => {
      const btn = document.getElementById('use-tap-destination');
      if (btn) btn.addEventListener('click', () => {
        selected = {id:'tapped-point', name:`Selected map point (${lat.toFixed(5)}, ${lng.toFixed(5)})`, building:'Map-selected location', floor:'Outdoor point', type:'Custom destination', lat, lon:lng, pinAccuracy:'user-selected'};
        select.value = '';
        search.value = selected.name;
        directionsButton.disabled = false;
        if (destinationMarker) map.removeLayer(destinationMarker);
        destinationMarker = L.marker([lat, lng], {icon: campusIQPin}).addTo(map);
        destinationMarker.bindPopup(`<strong>Selected map point</strong><br>Latitude: ${lat.toFixed(6)}<br>Longitude: ${lng.toFixed(6)}`).openPopup();
        status.textContent = `Destination set to ${lat.toFixed(6)}, ${lng.toFixed(6)}.`;
        map.closePopup();
        if (origin) {
          drawInAppDirections();
        } else {
          status.textContent += ' Requesting your location; walking directions will appear automatically if location access succeeds.';
          locateButton.click();
        }
      });
    });
  });

  directionsButton.addEventListener('click', drawInAppDirections);

  status.textContent = 'Campus map ready. Select a destination and use your location for distance and arrival estimates.';
})();

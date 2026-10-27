(() => {
  const $ = (s) => document.querySelector(s);
  const stops = [];
  const names = {"1":"Library","2":"Central Plaza","5":"Cafeteria","7":"Administration Office"};
  const stopList = $('#stops-list');
  $('#add-stop').addEventListener('click', () => {
    const value = $('#extra-stop').value;
    if (!value) return;
    if (stops.includes(value)) { stopList.textContent = `${names[value]} is already in your stops.`; return; }
    stops.push(value); stopList.replaceChildren();
    stops.forEach((id, i) => { const chip = document.createElement('span'); chip.className='stop-chip'; chip.textContent=`${i+1}. ${names[id]}`; stopList.appendChild(chip); });
    $('#extra-stop').value='';
  });
  const saveClassButton = $('#save-class');
  if (saveClassButton) saveClassButton.addEventListener('click', () => {
    const course=$('#class-course').value.trim(), room=$('#class-room').value.trim(), status=$('#timetable-status');
    if (!course || !room) { status.textContent='Enter both a course name and room code.'; return; }
    const search=$('#room-search'); search.value=room; search.dispatchEvent(new Event('input',{bubbles:true}));
    status.textContent=`Saved for this session: ${course} → ${room}. If the room is missing, add verified details to public/realmap.js.`;
  });
  for (const id of ['accessible-route','crowd-route','closed-path']) $('#'+id).addEventListener('change', () => {
    const status=$('#map-status'); if(status) status.textContent='Demo routing preference changed. The schematic C graph is not yet connected to the geographic map; use Walking directions for map-based directions.';
  });
})();

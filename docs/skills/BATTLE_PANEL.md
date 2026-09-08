# Consciousness battle panel

Base: `develop` / `7cccafa9f25b55e8ac5704f54237626058b1dc55`.
WORK: `work/skill-system-battle-panel-20260909`.
During delivery, develop advanced to `bf955ba` (diorama bokeh / motion
interpolation). This update is merged into the WORK branch. The render path
retains interpolated snapshots plus panel framing; unknown-skill preservation
and its compatibility notice remain in the five-column list area.

The consciousness panel now occupies the lower screen. Its upper row pairs the
allocation wheel with the selected technique's description; the independently
scrolling lower list has five columns. Jo / Ha / Kyu and passive techniques each
have a page. Passive techniques remain always active and have no weight control.
Selecting a tile only inspects it. The description's action button adds/removes
the technique through the existing weights command, while wheel boundaries
retain pointer and keyboard adjustment. Restrictions and discovery memories
remain visible in the description.

Opening the panel eases the player / current opponent into the upper free area.
The measured panel height drives framing, including resize/orientation changes.
The shift affects the view matrix and ground picking, leaving ordinary camera
follow and simulation coordinates intact. Closing eases back; reduced-motion
preference uses immediate framing. Portraits and the family screen are excluded.
The upper world accepts movement and automatic combat keeps running. Panel
controls do not send movement to the world. Switching to an ordinary modal
stops world input. Wardrobe retains its current layout until the user evaluates
the camera interaction, as requested.

Validation: `npm test` passes 133 cases after integration, including four new camera / real
simulation / UI tests. Camera projection and inverse ground picking cover
393×852, 740×720 and 852×393 with multiple yaws; transition rate covers
30 / 60 / 120 Hz. Existing movement, rest, inventory, equipment, save/restore,
lineage, character and skill regression tests also pass. These are Node/jsdom
and matrix checks, not browser or physical-device interaction tests.

Cloud Browser previously rejected local HTTP and shared-file URLs under its
URL policy. No alternate browser route is used. Visual layout, touch feel and
device frame pacing require the delivered standalone HTML to be tried in a
browser. The existing fast DEV CI checks build/tests; it does not run browser
smoke or provision a branch Preview URL. Integration WORK owns merging.

"use strict";
/* ================= Exercise library + figure engine ================= */
const R=Math.PI/180, f1=n=>(+n).toFixed(1);
const MUSCLES=[['chest','Chest'],['shoulders','Shoulders'],['biceps','Biceps'],['triceps','Triceps'],['forearms','Forearms'],['abs','Abs'],['obliques','Obliques'],['traps','Traps'],['lats','Lats'],['lowerback','Lower back'],['glutes','Glutes'],['quads','Quads'],['hamstrings','Hamstrings'],['calves','Calves']].map(([id,name])=>({id,name}));
const MN=Object.fromEntries(MUSCLES.map(m=>[m.id,m.name]));
const EQ={barbell:'Barbell',dumbbell:'Dumbbells',cable:'Cable',machine:'Machine',body:'Bodyweight',furniture:'Chair / table'};
/* Side view: figure faces right. Angles: 0 = down, 90 = forward, -90 = back, 180 = up.
   Keyframes: hip [x,y], t torso lean (0 upright, 90 lying face-down head right, -90 lying face-up head left),
   f1/f2 ankle targets (solved with two-bone IK, kh = knee hint), h1/h2 hand targets or keywords (eh = elbow hint),
   l1/a1 = explicit angles instead of targets, fo = foot angle. Floor is y 192. */
const ST={hip:[118,102.5],t:0,f1:[122,185],f2:[114,185],h1:'hang'}; // soft knees (~11°) when standing
const EX=[
 /* ---------- Legs ---------- */
 {id:'squat',name:'Barbell back squat',primary:['quads','glutes'],secondary:['hamstrings','lowerback'],eq:'barbell',held:'barbell',at:'back',inc:5,alt:['goblet','bulgarian','bwsquat'],
  cue:'Brace, sit down between your hips, knees track over toes. Hip crease just below the knee.',
  K:[{...ST,t:4,h1:'back',eh1:[-1,0.7]},{...ST,hip:[86,148],t:42,h1:'back',eh1:[-1,0.7]}]},
 {id:'goblet',name:'Goblet squat',primary:['quads','glutes'],secondary:['hamstrings','abs'],eq:'dumbbell',home:true,held:'goblet',inc:2,
  cue:'Hold one dumbbell at your chest, elbows inside the knees at the bottom, chest tall.',
  K:[{...ST,t:2,h1:'goblet',eh1:[0.2,1]},{...ST,hip:[88,148],t:24,h1:'goblet',eh1:[0.2,1]}]},
 {id:'bwsquat',name:'Bodyweight squat',primary:['quads','glutes'],secondary:['hamstrings'],eq:'body',home:true,bw:true,
  cue:'Feet shoulder width, arms reach forward as you sit back and down. Heels stay down.',
  K:[{...ST,h1:'hang'},{...ST,hip:[86,148],t:38,h1:'fwd',eh1:[0,1]}]},
 {id:'legpress',name:'Leg press',primary:['quads','glutes'],secondary:['hamstrings'],eq:'machine',inc:10,alt:['bulgarian','bwsquat','wallsit'],
  props:[['sled'],['incl',128,162,58,118],['seat',72,156,58]],
  cue:'Lower back stays on the pad. Bring the knees toward the chest, push through the whole foot.',
  K:[{hip:[96,150],t:-58,f1:[156,100],fo1:140,kh1:[-0.2,-1],h1:[104,156],eh1:[0,1]},{hip:[96,150],t:-58,f1:[130,120],fo1:140,kh1:[-0.2,-1],h1:[104,156],eh1:[0,1]}]},
 {id:'legext',name:'Leg extension',primary:['quads'],secondary:[],eq:'machine',iso:true,inc:5,alt:['wallsit','bulgarian'],
  props:[['seat',72,148,62],['back',76,148,60,96],['roller',1,[8,0]]],
  cue:'Knee lined up with the machine pivot. Squeeze at the top for a second, lower slowly.',
  K:[{hip:[100,140],t:-12,l1:[90,2],h1:[106,150],eh1:[0,1]},{hip:[100,140],t:-12,l1:[90,84],h1:[106,150],eh1:[0,1]}]},
 {id:'lunge',name:'Dumbbell split squat',primary:['quads','glutes'],secondary:['hamstrings'],eq:'dumbbell',home:true,held:'dumbbell',inc:2,
  cue:'Long stance, drop the back knee straight down, front shin stays close to vertical.',
  K:[{hip:[104,108],t:2,f1:[132,185],f2:[60,178],fo2:46,kh2:[0.2,1],h1:'hang'},{hip:[100,142],t:4,f1:[132,185],f2:[60,178],fo2:46,kh2:[0.2,1],h1:'hang'}]},
 {id:'bulgarian',name:'Bulgarian split squat',primary:['quads','glutes'],secondary:['hamstrings'],eq:'furniture',home:true,bw:true,
  props:[['chair',22,140,48,'L']],
  cue:'Back foot laces-down on a chair. Lower straight down until the front thigh is level.',
  K:[{hip:[100,110],t:2,f1:[132,185],f2:[58,134],fo2:-80,kh2:[0,1],h1:'hang'},{hip:[96,142],t:8,f1:[132,185],f2:[58,134],fo2:-80,kh2:[0,1],h1:'hang'}]},
 {id:'revlunge',name:'Reverse lunge',primary:['quads','glutes'],secondary:['hamstrings','calves'],eq:'body',home:true,bw:true,
  cue:'Step back, drop the back knee toward the floor, drive through the front heel to stand.',
  K:[{...ST,f1:[124,185],f2:[114,185],h1:'hang'},{hip:[98,140],t:4,f1:[124,185],f2:[48,178],fo2:46,kh2:[0.2,1],h1:'hang'}]},
 {id:'stepup',name:'Step-up',primary:['quads','glutes'],secondary:['calves'],eq:'furniture',home:true,bw:true,
  props:[['chair',130,142,52,'R']],
  cue:'Whole foot on a sturdy chair or step. Push through that heel, drive the other knee up.',
  K:[{hip:[110,108],t:6,f1:[146,136],f2:[106,185],kh1:[1,-0.3],h1:'hang'},{hip:[140,60],t:0,f1:[146,136],f2:[176,100],fo2:70,kh2:[1,-0.6],h1:'hang'}]},
 {id:'wallsit',name:'Wall sit',primary:['quads'],secondary:['glutes'],eq:'body',home:true,bw:true,timed:true,iso:true,
  props:[['wall',58]],
  cue:'Back flat on the wall, thighs level, knees over ankles. Hold and breathe. Log seconds.',
  K:[{hip:[76,140],t:-2,f1:[119,182],kh1:[1,-0.5],h1:'chest',eh1:[0,1]},{hip:[76,141],t:-2,f1:[119,182],kh1:[1,-0.5],h1:'chest',eh1:[0,1]}]},
 {id:'deadlift',name:'Conventional deadlift',primary:['glutes','hamstrings','lowerback'],secondary:['quads','traps','forearms'],eq:'barbell',held:'barbell',inc:5,alt:['slrdl','glutebridge'],
  cue:'Bar over mid-foot, push the floor away, hips and shoulders rise together, lock out tall.',
  K:[{hip:[84,136],t:58,f1:[122,185],f2:[114,185],h1:[122,165]},{...ST,h1:[120,111]}]},
 {id:'rdl',name:'Romanian deadlift',primary:['hamstrings','glutes'],secondary:['lowerback','forearms'],eq:'barbell',held:'barbell',inc:5,alt:['slrdl'],
  cue:'Soft knees, push the hips back until the hamstrings stretch. The bar slides down the legs.',
  K:[{...ST,h1:[120,111]},{hip:[84,120],t:78,f1:[122,185],f2:[114,185],h1:[127,160]}]},
 {id:'slrdl',name:'Single-leg Romanian deadlift',primary:['hamstrings','glutes'],secondary:['lowerback'],eq:'body',home:true,bw:true,
  cue:'Hinge on one leg, the back leg rises in line with your torso. Hips stay square.',
  K:[{...ST,f2:[110,182],h1:'hang'},{hip:[100,114],t:82,f1:[122,185],f2:[20,126],fo2:-10,kh2:[0,1],h1:'hang'}]},
 {id:'hipthrust',name:'Barbell hip thrust',primary:['glutes'],secondary:['hamstrings'],eq:'barbell',held:'barbell',at:'hip',inc:5,alt:['glutebridge'],
  props:[['bench',14,151,66]],
  cue:'Upper back on the bench, chin tucked, drive through the heels to a flat top.',
  K:[{hip:[112,172],t:-52,f1:[150,185],kh1:[0,-1],h1:'bar',eh1:[0,1]},{hip:[120,140],t:-90,f1:[150,185],kh1:[0,-1],h1:'bar',eh1:[0,1]}]},
 {id:'glutebridge',name:'Glute bridge',primary:['glutes'],secondary:['hamstrings','lowerback'],eq:'body',home:true,bw:true,
  props:[['mat']],
  cue:'Feet close to the hips, push through the heels and squeeze the glutes at the top.',
  K:[{hip:[104,181],t:-88,f1:[142,185],kh1:[0,-1],h1:[114,188],eh1:[0,-1]},{hip:[104,154],t:-123,f1:[142,185],kh1:[0,-1],h1:[114,188],eh1:[0,-1]}]},
 {id:'legcurl',name:'Lying leg curl',primary:['hamstrings'],secondary:['calves'],eq:'machine',iso:true,inc:2.5,alt:['slrdl','glutebridge'],
  props:[['bench',8,159,176],['roller',1,[0,-8]]],
  cue:'Hips pressed into the pad, curl the heels toward the glutes, lower slowly.',
  K:[{hip:[96,150],t:90,l1:[-90,-90],fo1:0,h1:[178,166],eh1:[0,1]},{hip:[96,150],t:90,l1:[-90,-170],fo1:-80,h1:[178,166],eh1:[0,1]}]},
 {id:'calf',name:'Standing calf raise',primary:['calves'],secondary:[],eq:'dumbbell',home:true,held:'dumbbell',iso:true,inc:2,alt:['slcalf'],
  cue:'Full stretch at the bottom, rise onto the big toe, hold the top for a second.',
  K:[{...ST},{hip:[120,95],t:0,f1:[124,177],fo1:50,f2:[116,177],fo2:50,h1:'hang'}]},
 {id:'slcalf',name:'Single-leg calf raise',primary:['calves'],secondary:[],eq:'body',home:true,bw:true,iso:true,
  props:[['wall',172]],
  cue:'One hand on the wall for balance, slow up and slower down. Use a step for more range.',
  K:[{hip:[118,104],t:0,f1:[122,185],f2:[100,150],kh2:[0.3,1],h1:[168,90],eh1:[0,1]},{hip:[120,95],t:0,f1:[124,177],fo1:50,f2:[102,141],kh2:[0.3,1],h1:[168,84],eh1:[0,1]}]},
 /* ---------- Chest / shoulders / triceps ---------- */
 {id:'bench',name:'Barbell bench press',primary:['chest'],secondary:['triceps','shoulders'],eq:'barbell',held:'barbell',inc:2.5,alt:['pushup','diamond'],
  props:[['bench',40,151,110]],
  cue:'Shoulder blades pinched, feet planted. Touch the lower chest, press up and slightly back.',
  K:[{hip:[128,142],t:-90,f1:[166,185],f2:[160,185],kh1:[0,-1],h1:[88,86],eh1:[0,1]},{hip:[128,142],t:-90,f1:[166,185],f2:[160,185],kh1:[0,-1],h1:[100,124],eh1:[0,1]}]},
 {id:'incline',name:'Incline dumbbell press',primary:['chest','shoulders'],secondary:['triceps'],eq:'dumbbell',held:'dumbbell',inc:2,alt:['pike','pushup'],
  props:[['incl',128,160,72,120],['seat',96,158,40]],
  cue:'Bench at about 30°. Lower the dumbbells to the upper chest, press up over the shoulders.',
  K:[{hip:[120,150],t:-55,f1:[170,185],f2:[164,185],kh1:[0,-1],h1:[96,70],eh1:[0,1]},{hip:[120,150],t:-55,f1:[170,185],f2:[164,185],kh1:[0,-1],h1:[102,114],eh1:[0,1]}]},
 {id:'pushup',name:'Push-up',primary:['chest'],secondary:['triceps','shoulders','abs'],eq:'body',home:true,bw:true,
  cue:'Hands under the shoulders, body in one straight line, chest to the floor.',
  K:[{hip:[108,148],t:64,f1:[33,180],f2:[37,180],fo1:25,h1:[150,186],eh1:[-1,-0.5]},{hip:[115,171],t:84,f1:[33,180],f2:[37,180],fo1:25,h1:[150,186],eh1:[-1,-0.5]}]},
 {id:'diamond',name:'Diamond push-up',primary:['triceps','chest'],secondary:['shoulders'],eq:'body',home:true,bw:true,
  cue:'Hands together under the chest, elbows brush the ribs on the way down.',
  K:[{hip:[108,148],t:64,f1:[33,180],f2:[37,180],fo1:25,h1:[150,186],eh1:[-1,-0.2]},{hip:[115,171],t:84,f1:[33,180],f2:[37,180],fo1:25,h1:[150,186],eh1:[-1,-0.2]}]},
 {id:'pike',name:'Pike push-up',primary:['shoulders'],secondary:['triceps','chest'],eq:'body',home:true,bw:true,
  cue:'Hips high in an upside-down V, lower the top of the head toward the floor between the hands.',
  K:[{hip:[107,103],t:130,f1:[72,182],f2:[76,182],fo1:30,h1:[150,186],eh1:[-1,-0.5]},{hip:[118,122],t:144,f1:[72,182],f2:[76,182],fo1:30,h1:[150,186],eh1:[-1,-0.5]}]},
 {id:'ohp',name:'Overhead press',primary:['shoulders'],secondary:['triceps','traps'],eq:'barbell',held:'barbell',inc:2.5,alt:['pike'],
  cue:'Squeeze the glutes, press in a straight line and move the head through at the top.',
  K:[{...ST,h1:[131,62],eh1:[1,1]},{...ST,h1:[119,2],eh1:[1,0]}]},
 {id:'lateral',name:'Dumbbell lateral raise',primary:['shoulders'],secondary:['traps'],eq:'dumbbell',home:true,view:'front',held:'dumbbell',iso:true,inc:1,
  cue:'Lead with the elbows, raise to shoulder height, lower over 2–3 seconds.',
  K:[{ab:8,eb:4},{ab:86,eb:6}]},
 {id:'fly',name:'Cable crossover',primary:['chest'],secondary:['shoulders'],eq:'cable',view:'front',held:'handle',iso:true,inc:2.5,alt:['pushup'],
  cue:'Slight bend in the elbows, hug a big tree, squeeze the chest where the hands meet.',
  K:[{ab:80,eb:14},{ab:22,eb:-36}]},
 {id:'dips',name:'Parallel-bar dips',primary:['triceps','chest'],secondary:['shoulders'],eq:'body',bw:true,noFloor:true,alt:['chairdip'],
  props:[['dipbar']],
  cue:'Lean slightly forward, lower until the shoulders are just below the elbows, press up.',
  K:[{hip:[120,96],t:4,f1:[100,150],kh1:[1,0.4],h1:[128,106],eh1:[-1,-0.5]},{hip:[122,128],t:16,f1:[104,182],kh1:[1,0.4],h1:[128,106],eh1:[-1,-0.5]}]},
 {id:'chairdip',name:'Chair dips',primary:['triceps'],secondary:['chest','shoulders'],eq:'furniture',home:true,bw:true,
  props:[['chair',38,140,50,'L']],
  cue:'Hands on the chair edge behind you, hips close to it. Bend the elbows straight back to 90°.',
  K:[{hip:[96,128],t:-8,f1:[172,185],kh1:[0,-1],h1:[86,138],eh1:[-1,-0.2]},{hip:[98,160],t:-8,f1:[172,185],kh1:[0,-1],h1:[86,138],eh1:[-1,-0.2]}]},
 {id:'pushdown',name:'Cable triceps pushdown',primary:['triceps'],secondary:[],eq:'cable',held:'handle',iso:true,inc:2.5,alt:['diamond','chairdip'],
  props:[['tower',172,6]],
  cue:'Upper arms pinned, push down until the elbows lock, spread the rope at the bottom.',
  K:[{...ST,t:6,h1:[146,86],eh1:[-0.2,1]},{...ST,t:6,h1:[130,114],eh1:[-0.2,1]}]},
 /* ---------- Back / biceps ---------- */
 {id:'pullup',name:'Pull-up',primary:['lats'],secondary:['biceps','forearms'],eq:'body',home:true,bw:true,noFloor:true,note:'doorway bar',
  props:[['bar',2]],
  cue:'Dead hang, drive the elbows down to the ribs, chin over the bar. A doorway bar works at home.',
  K:[{hip:[122,104],t:0,f1:[104,170],kh1:[1,0.3],h1:[130,4],eh1:[0.3,1]},{hip:[113,56],t:5,f1:[96,122],kh1:[1,0.3],h1:[130,4],eh1:[0.3,1]}]},
 {id:'pulldown',name:'Lat pulldown',primary:['lats'],secondary:['biceps','traps'],eq:'machine',held:'handle',inc:5,alt:['pullup','invrow'],
  props:[['cable',112,-24],['seat',82,152,50],['kneepad']],
  cue:'Lean back slightly, pull the bar to the top of the chest, elbows drive down and back.',
  K:[{hip:[108,146],t:-6,f1:[150,185],kh1:[1,-1],h1:[110,48],eh1:[0,-1]},{hip:[108,146],t:-10,f1:[150,185],kh1:[1,-1],h1:[116,94],eh1:[-0.4,1]}]},
 {id:'row',name:'Barbell bent-over row',primary:['lats','traps'],secondary:['biceps','lowerback'],eq:'barbell',held:'barbell',inc:2.5,alt:['invrow','dbrow'],
  cue:'Hinge to about 70°, pull the bar to the lower ribs, pause, lower under control.',
  K:[{hip:[88,118],t:68,f1:[122,185],f2:[114,185],h1:[130,156]},{hip:[88,118],t:68,f1:[122,185],f2:[114,185],h1:[114,118],eh1:[-1,-0.6]}]},
 {id:'dbrow',name:'One-arm dumbbell row',primary:['lats'],secondary:['biceps','traps'],eq:'dumbbell',home:true,held:'dumbbell1',inc:2,
  props:[['bench',140,140,72]],
  cue:'Free hand on a bench or chair, back flat. Row the dumbbell to the hip, not the chest.',
  K:[{hip:[92,116],t:82,f1:[126,185],f2:[64,185],h1:[134,165],h2:[158,140],eh2:[-0.3,1]},{hip:[92,116],t:82,f1:[126,185],f2:[64,185],h1:[110,122],eh1:[-1,-0.8],h2:[158,140],eh2:[-0.3,1]}]},
 {id:'cablerow',name:'Seated cable row',primary:['lats','traps'],secondary:['biceps','lowerback'],eq:'cable',held:'handle',inc:5,alt:['invrow','dbrow'],
  props:[['seat',52,168,60],['footplate',162],['cable',206,150]],
  cue:'Sit tall, pull the handle to the stomach and squeeze the shoulder blades together.',
  K:[{hip:[80,160],t:25,f1:[156,166],fo1:170,kh1:[0,-1],h1:[150,134],eh1:[0,1]},{hip:[80,160],t:-8,f1:[156,166],fo1:170,kh1:[0,-1],h1:[102,140],eh1:[-1,0.2]}]},
 {id:'invrow',name:'Inverted row (table)',primary:['lats','traps'],secondary:['biceps'],eq:'furniture',home:true,bw:true,
  props:[['table',10,110,98]],
  cue:'Lie face up under a sturdy table, grip the edge, heels on the floor. Keep a straight line from heels to head and pull your chest to the edge.',
  K:[{hip:[145.8,174.7],t:-84,f1:[226,183],f2:[222,183],fo1:174,h1:[100,113],h2:[96,113]},{hip:[150.2,150.3],t:-66.6,f1:[226,183],f2:[222,183],fo1:157,h1:[100,113],h2:[96,113]}]},
 {id:'superman',name:'Superman',primary:['lowerback'],secondary:['glutes'],eq:'body',home:true,bw:true,iso:true,
  props:[['mat']],
  cue:'Face down, lift the arms, chest and legs a few centimetres, hold for two seconds.',
  K:[{hip:[100,183],t:90,l1:[-90,-90],fo1:0,a1:'along'},{hip:[100,183],t:76,l1:[-104,-102],fo1:-14,a1:'along'}]},
 {id:'backext',name:'Back extension',primary:['lowerback'],secondary:['glutes','hamstrings'],eq:'machine',bw:true,iso:true,alt:['superman'],
  props:[['hyper']],
  cue:'Hinge over the pad, rise until the body is a straight line. No arching past that.',
  K:[{hip:[112,112],t:170,f1:[38,146],fo1:10,h1:'chest',eh1:[0,1]},{hip:[112,112],t:74,f1:[38,146],fo1:10,h1:'chest',eh1:[0,1]}]},
 {id:'curl',name:'Dumbbell biceps curl',primary:['biceps'],secondary:['forearms'],eq:'dumbbell',home:true,held:'dumbbell',iso:true,inc:1,
  cue:'Elbows pinned to your sides, no swinging. Turn the pinky up at the top.',
  K:[{...ST,a1:[2,4]},{...ST,a1:[6,158]}]},
 {id:'shrug',name:'Dumbbell shrug',primary:['traps'],secondary:['forearms'],eq:'dumbbell',home:true,view:'front',held:'dumbbell',iso:true,inc:2,
  cue:'Shoulders straight up toward the ears, pause, lower. No rolling.',
  K:[{ab:5,eb:0,sy:0},{ab:5,eb:0,sy:10}]},
 {id:'farmer',name:"Farmer's carry",primary:['forearms','traps'],secondary:['obliques'],eq:'dumbbell',home:true,held:'dumbbell',timed:true,inc:2,
  cue:'Heavy dumbbells or shopping bags, tall posture, short quick steps. Log seconds.',
  K:[{hip:[118,106],t:0,f1:[134,185],fo1:104,f2:[100,183],fo2:62,h1:'hang'},{hip:[118,106],t:0,f1:[100,183],fo1:62,f2:[134,185],fo2:104,h1:'hang'}]},
 /* ---------- Core ---------- */
 {id:'plank',name:'Front plank',primary:['abs'],secondary:['obliques','shoulders'],eq:'body',home:true,bw:true,timed:true,iso:true,
  props:[['mat']],
  cue:'Elbows under the shoulders, squeeze the glutes, ribs down. Log seconds.',
  K:[{hip:[85,165],t:78,f1:[6,182],f2:[10,182],fo1:20,h1:[156,186],eh1:[-0.4,1]},{hip:[85,162],t:77,f1:[6,182],f2:[10,182],fo1:20,h1:[156,186],eh1:[-0.4,1]}]},
 {id:'sideplank',name:'Side plank',primary:['obliques'],secondary:['abs','shoulders'],eq:'body',home:true,bw:true,timed:true,iso:true,
  props:[['mat']],
  cue:'Elbow under the shoulder, feet stacked, lift the hips into a straight line. Log seconds per side.',
  K:[{hip:[85,174],t:72,f1:[6,182],f2:[6,182],fo1:20,h1:[156,186],eh1:[-0.4,1],a2:[180,180]},{hip:[85,160],t:78,f1:[6,182],f2:[6,182],fo1:20,h1:[156,186],eh1:[-0.4,1],a2:[180,180]}]},
 {id:'crunch',name:'Crunch',primary:['abs'],secondary:[],eq:'body',home:true,bw:true,iso:true,
  props:[['mat']],
  cue:'Curl the ribs toward the pelvis, lower back stays down. Breathe out on the way up.',
  K:[{hip:[110,181],t:-90,f1:[146,185],kh1:[0,-1],h1:'chest',eh1:[0,1]},{hip:[110,181],t:-58,f1:[146,185],kh1:[0,-1],h1:'chest',eh1:[0,1]}]},
 {id:'legraise',name:'Hanging leg raise',primary:['abs'],secondary:['obliques','forearms'],eq:'body',bw:true,noFloor:true,alt:['crunch','plank'],
  props:[['bar',2]],
  cue:'No swinging. Tilt the pelvis up as the legs rise, lower slowly.',
  K:[{hip:[122,104],t:-2,l1:[4,2],fo1:30,h1:[124,4],eh1:[0,1]},{hip:[126,100],t:-10,l1:[92,92],fo1:150,h1:[124,4],eh1:[0,1]}]},
 {id:'climber',name:'Mountain climber',primary:['abs'],secondary:['shoulders','quads','obliques'],eq:'body',home:true,bw:true,timed:true,
  cue:'High plank, drive one knee to the chest then switch quickly. Hips stay level.',
  K:[{hip:[110,150],t:64,f1:[128,176],kh1:[1,0.6],f2:[35,180],fo2:25,h1:[156,186],eh1:[-1,-0.3]},{hip:[110,150],t:64,f1:[35,180],fo1:25,f2:[128,176],kh2:[1,0.6],h1:[156,186],eh1:[-1,-0.3]}]},
 {id:'sidebend',name:'Dumbbell side bend',primary:['obliques'],secondary:['abs'],eq:'dumbbell',home:true,view:'front',held:'dumbbellR',iso:true,inc:2,
  cue:'Stay in one plane, bend toward the weight, pull back up with the opposite side.',
  K:[{ab:4,eb:0,tilt:-14},{ab:4,eb:0,tilt:12}]},
 /* ---------- Full body ---------- */
 {id:'burpee',name:'Burpee',primary:['quads','chest'],secondary:['shoulders','abs','glutes'],eq:'body',home:true,bw:true,
  cue:'Squat, hands down, jump the feet back to a plank, jump them in, then jump up and reach.',
  K:[{hip:[118,98],t:0,f1:[122,179],f2:[114,179],fo1:70,h1:[119,-4],eh1:[0,-1]},
     {hip:[106,152],t:62,f1:[122,185],f2:[114,185],h1:[150,186],eh1:[0,1]},
     {hip:[110,150],t:64,f1:[33,180],f2:[38,180],fo1:25,h1:[156,186],eh1:[-1,-0.3]},
     {hip:[106,152],t:62,f1:[122,185],f2:[114,185],h1:[150,186],eh1:[0,1]}]},
 /* ---------- Cardio (logged as minutes, distance and effort) ---------- */
];
(function addCardio(){
  const RUN=[ // a running stride: contact, mid-stance, contact (other leg), mid-stance; arms swing opposite the legs
    {hip:[116,99.5],t:9,l1:[30,14],l2:[-26,-78],fo1:96,fo2:40,a1:[-38,48],a2:[34,118]},
    {hip:[116,103.5],t:9,l1:[3,-6],l2:[-2,-112],fo1:90,fo2:62,a1:[0,86],a2:[0,86]},
    {hip:[116,99.5],t:9,l1:[-26,-78],l2:[30,14],fo1:40,fo2:96,a1:[34,118],a2:[-38,48]},
    {hip:[116,103.5],t:9,l1:[-2,-112],l2:[3,-6],fo1:62,fo2:90,a1:[0,86],a2:[0,86]}];
  const ring=(n,fn)=>[...Array(n)].map((_,i)=>fn(i/n*2*Math.PI));
  const C=(id,name,eq,extra)=>EX.push({id,name,primary:['quads','calves'],secondary:['glutes','hamstrings'],eq,cardio:true,loop:true,iso:false,...extra});
  C('run','Running (outdoors)','body',{home:true,met:[7,9.8,11.5],speed:true,cue:'Easy runs at a pace you can still talk. Land under your hips with short, quick steps and relaxed shoulders.',K:RUN});
  C('treadmill','Treadmill run','machine',{alt:['run'],met:[7,9.8,11.5],speed:true,props:[['treadmill']],cue:'Stay near the front of the belt, look ahead, light quick steps. A 1% incline feels closest to running outside.',K:RUN.map(k=>({...k,hip:[k.hip[0],k.hip[1]-3]}))});
  C('bike','Stationary bike','machine',{alt:['run'],met:[5.5,7,10],primary:['quads'],secondary:['glutes','calves','hamstrings'],props:[['bike',100,112,124,160,150,96]],
    cue:'Seat at hip height: a slight knee bend at the bottom of each pedal stroke. Push and pull through the whole circle.',
    K:ring(8,a=>({hip:[100,106],t:36,f1:[124+17*Math.cos(a),160+17*Math.sin(a)],f2:[124-17*Math.cos(a),160-17*Math.sin(a)],fo1:84,fo2:84,h1:[154,96],h2:[150,98]}))});
  C('rower','Rowing machine','machine',{alt:['run'],met:[4.8,7,8.5],primary:['lats','quads'],secondary:['glutes','hamstrings','biceps','lowerback'],props:[['rower']],
    cue:'Legs, then body, then arms on the drive. Arms, then body, then legs on the way back. About 1 part drive to 2 parts recovery.',
    K:[{hip:[104,172],t:24,f1:[150,170],f2:[147,170],fo1:150,h1:[174,148]},{hip:[78,172],t:20,f1:[150,170],f2:[147,170],fo1:150,h1:[148,150]},
       {hip:[72,172],t:-20,f1:[150,170],f2:[147,170],fo1:150,h1:[78,150]},{hip:[74,172],t:16,f1:[150,170],f2:[147,170],fo1:150,h1:[146,150]}]});
  C('elliptical','Elliptical','machine',{alt:['run'],met:[4.6,5.5,7],primary:['quads'],secondary:['glutes','hamstrings','shoulders'],props:[['elliptical']],
    cue:'Stand tall, push and pull the handles as you stride. Keep your heels down for more glutes, light on the rails.',
    K:ring(8,a=>({hip:[114,98],t:5,f1:[122+20*Math.cos(a),174+6*Math.sin(a)],f2:[122-20*Math.cos(a),174-6*Math.sin(a)],fo1:92,fo2:92,h1:[152-11*Math.cos(a),110],h2:[152+11*Math.cos(a),110]}))});
})();

/* ---------- Geometry ---------- */
const mv=(P,a,l)=>[P[0]+Math.sin(a*R)*l,P[1]+Math.cos(a*R)*l];
/* Two-bone IK. sgn fixes which way the joint bends (knees +1, elbows -1, the only way real joints flex),
   so a limb can never fold backwards or flip sides mid-rep; hint is only used when no sign is given. */
function ik(root,tg,l1,l2,hint,sgn){
  const dx=tg[0]-root[0],dy=tg[1]-root[1],d=Math.hypot(dx,dy)||0.01, dd=Math.max(Math.abs(l1-l2)+0.5,Math.min(l1+l2-0.3,d));
  const th=Math.atan2(dy,dx), a=Math.acos(Math.max(-1,Math.min(1,(l1*l1+dd*dd-l2*l2)/(2*l1*dd))));
  const j1=[root[0]+l1*Math.cos(th+a),root[1]+l1*Math.sin(th+a)], j2=[root[0]+l1*Math.cos(th-a),root[1]+l1*Math.sin(th-a)];
  const cr=j=>(j[0]-root[0])*(tg[1]-j[1])-(j[1]-root[1])*(tg[0]-j[0]);
  const sc=j=>(j[0]-root[0])*hint[0]+(j[1]-root[1])*hint[1], j=sgn?(cr(j1)*sgn>=cr(j2)*sgn?j1:j2):(sc(j1)>=sc(j2)?j1:j2);
  const ex=tg[0]-j[0],ey=tg[1]-j[1],el=Math.hypot(ex,ey)||1; return[j,[j[0]+ex/el*l2,j[1]+ey/el*l2]];
}
function normK(ex){if(ex._K) return ex._K; const base=ex.K[0]; ex._K=ex.K.map(k=>({...base,...k})); return ex._K;}
function lerpK(a,b,u){const o={}; for(const k in a){const x=a[k],y=k in b?b[k]:x;
  if(typeof x==='number'&&typeof y==='number') o[k]=x+(y-x)*u;
  else if(Array.isArray(x)&&Array.isArray(y)&&typeof x[0]==='number') o[k]=x.map((v,i)=>v+(y[i]-v)*u);
  else o[k]=u<0.5?x:y;} for(const k in b) if(!(k in o)&&u>=0.5) o[k]=b[k]; return o;}
/* Smootherstep with short holds: starts and stops gently, like a controlled rep. */
const ease=f=>f<0.12?0:f>0.88?1:(g=>g*g*g*(g*(g*6-15)+10))((f-0.12)/0.76);
/* Tempo: with two keyframes the first half (usually the lowering) takes a bit longer than the lift. */
function phaseSeg(ex,ph){const n=ex.K.length, q=((ph%1)+1)%1; if(n!==2||ex.loop) {const x=q*n, i=Math.floor(x); return[i,x-i];} const d=0.56; return q<d?[0,q/d]:[1,(q-d)/(1-d)];}
const wrapA=a=>{while(a>Math.PI) a-=2*Math.PI; while(a<-Math.PI) a+=2*Math.PI; return a;};
/* Hands and feet move relative to the shoulder/hip: fixed grips stay put, body-relative holds ride along with the torso,
   and big swings (arms overhead to the floor) travel in an arc instead of cutting through the shoulder. */
function effector(Pa,Pb,ra,rb,r,u,worldFixed){
  if(Math.hypot(Pa[0]-Pb[0],Pa[1]-Pb[1])<0.5&&worldFixed) return Pa.slice();
  const va=[Pa[0]-ra[0],Pa[1]-ra[1]], vb=[Pb[0]-rb[0],Pb[1]-rb[1]], aa=Math.atan2(va[1],va[0]), sw=wrapA(Math.atan2(vb[1],vb[0])-aa);
  if(Math.abs(sw)>50*R){const L=Math.hypot(...va)+(Math.hypot(...vb)-Math.hypot(...va))*u, a=aa+sw*u; return[r[0]+Math.cos(a)*L,r[1]+Math.sin(a)*L];}
  if(worldFixed) return[Pa[0]+(Pb[0]-Pa[0])*u,Pa[1]+(Pb[1]-Pa[1])*u];
  return[r[0]+va[0]+(vb[0]-va[0])*u,r[1]+va[1]+(vb[1]-va[1])*u];}
function poseAt(ex,ph){const K=normK(ex), n=K.length, [i,fr]=phaseSeg(ex,ph), f=ex.loop?fr:ease(fr), A=K[i], B=K[(i+1)%n], o=lerpK(A,B,f);
  if(ex.view==='front'||f<=0||f>=1) return f>=1?{...B}:f<=0?{...A}:o;
  const Ja=solveSide(ex,A), Jb=solveSide(ex,B), J=solveSide(ex,o);
  for(const s of [1,2]){
    if(!(A['a'+s]||B['a'+s]||(s===2&&(A.a1||B.a1)&&A.h2==null&&B.h2==null))){
      const ka='h'+s, fixed=Array.isArray(A[ka]??A.h1)&&Array.isArray(B[ka]??B.h1);
      const ha=Ja['hand'+s], hb=Jb['hand'+s], q=effector(ha,hb,Ja.sho,Jb.sho,J.sho,f,fixed); if(ha[1]>170&&hb[1]>170) q[1]=Math.min(q[1],Math.max(ha[1],hb[1])); o['h'+s]=q;
      const hs=x=>{const v=x['h'+s]??x.h1; return v==='back'||v==='chest';}; if(hs(A)||hs(B)) o['free'+s]=1;}
    const legAngles=A['l'+s]||B['l'+s]||(s===2&&(A.l1||B.l1)&&!A.f2&&!B.f2);
    if(!legAngles){const fa=Ja['ank'+s], fb=Jb['ank'+s], q=effector(fa,fb,Ja.hip,Jb.hip,J.hip,f,true); q[1]=Math.min(q[1],Math.max(fa[1],fb[1])); o['f'+s]=q;}}  // feet never sink through the floor
  return o;}

function solveSide(ex,p){
  const hip=p.hip, t=p.t, u=[Math.sin(t*R),-Math.cos(t*R)], n=[Math.cos(t*R),Math.sin(t*R)], at=d=>[hip[0]+u[0]*d,hip[1]+u[1]*d];
  const J={hip,u,n,t,sho:at(46),neck:at(53),head:at(62)}, sho=J.sho;
  for(const i of [1,2]){let knee,ank; const L=p['l'+i]||(i===2?p.l1:null);
    if(L&&(i===1||!p.f2)){knee=mv(hip,L[0],42); ank=mv(knee,L[1],41);}
    else{const f=p['f'+i]||(i===2?[p.f1[0]-6,p.f1[1]]:p.f1); [knee,ank]=ik(hip,f,42,41,p['kh'+i]||(i===2&&!p.f2?p.kh1:null)||[1,-0.1],1);}
    const fo=p['fo'+i]??(i===2?(p.fo1??90):90); J['knee'+i]=knee; J['ank'+i]=ank; J['toe'+i]=mv(ank,fo,14); J['heel'+i]=mv(ank,fo,-3);}
  const tgt=s=>Array.isArray(s)?s:s==='hang'?[sho[0]+1,sho[1]+55]:s==='chest'?[sho[0]-u[0]*15+n[0]*11,sho[1]-u[1]*15+n[1]*11]:s==='back'?[sho[0]-n[0]*8+u[0]*1,sho[1]-n[1]*8+u[1]*1]
    :s==='goblet'?[sho[0]+n[0]*16-u[0]*16,sho[1]+n[1]*16-u[1]*16]:s==='fwd'?[sho[0]+54,sho[1]+4]:s==='bar'?[hip[0],hip[1]-12]:[sho[0],sho[1]+55];
  for(const i of [1,2]){let a=p['a'+i]; if(a==null&&i===2&&p.h2==null) a=p.a1; let elb,hand;
    if(a){if(a==='along'){const v=180-t+4; a=[v,v];} if(i===2&&p.a2==null) a=[a[0]-6,a[1]-6]; elb=mv(sho,a[0],30); hand=mv(elb,a[1],27);}
    else{let s=p['h'+i]; if(s==null) s=p.h1; let tg=tgt(s).slice(); if(i===2&&p.h2==null&&(ex.held==='dumbbell'||ex.held==='dumbbell1'||!ex.held)&&(s==='hang')) tg=[tg[0]-5,tg[1]];
      // Bar on the back / arms across the chest involve shoulder rotation that a side view can't show, so those keep their drawn pose.
      const free=p['free'+i]||s==='back'||s==='chest';
      [elb,hand]=ik(sho,tg,30,27,p['eh'+i]||(i===2&&p.h2==null?p.eh1:null)||[-0.3,1],free?0:-1);}
    J['elb'+i]=elb; J['hand'+i]=hand;}
  return J;
}

/* ---------- Drawing ---------- */
function cap(a,b,ra,rb,cls){const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
  return`<path class="${cls}" d="M${f1(a[0]+nx*ra)} ${f1(a[1]+ny*ra)}L${f1(b[0]+nx*rb)} ${f1(b[1]+ny*rb)}L${f1(b[0]-nx*rb)} ${f1(b[1]-ny*rb)}L${f1(a[0]-nx*ra)} ${f1(a[1]-ny*ra)}Z"/><circle class="${cls}" cx="${f1(a[0])}" cy="${f1(a[1])}" r="${ra}"/><circle class="${cls}" cx="${f1(b[0])}" cy="${f1(b[1])}" r="${rb}"/>`;}
function belly(a,b,f0,f1_,side,r,cls){const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1, ax=dy/L, ay=-dx/L; // anterior normal for limbs
  const m=(f0+f1_)/2, cx=a[0]+dx*m+ax*side*r*0.42, cy=a[1]+dy*m+ay*side*r*0.42, rx=L*(f1_-f0)/2, ry=r*0.62, ang=Math.atan2(dy,dx)/R;
  return`<ellipse class="${cls}" cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(rx)}" ry="${f1(ry)}" transform="rotate(${f1(ang)} ${f1(cx)} ${f1(cy)})"/>`;}
function torsoPath(J,cls){const{hip,u,n}=J, P=(f,o)=>[hip[0]+u[0]*46*f+n[0]*o,hip[1]+u[1]*46*f+n[1]*o];
  const pts=[P(0,7.5),P(0.38,7),P(0.72,10),P(1,6.5),P(1.08,0),P(1,-7.5),P(0.74,-8.6),P(0.36,-6.8),P(0.02,-9.6),P(-0.1,-4)];
  return`<path class="${cls}" stroke-linejoin="round" d="M${pts.map(p=>f1(p[0])+' '+f1(p[1])).join('L')}Z"/>`;}
function torsoBelly(J,f0,f1_,side,w,cls){const{hip,u,n}=J, m=(f0+f1_)/2, off=side*6; const cx=hip[0]+u[0]*46*m+n[0]*off, cy=hip[1]+u[1]*46*m+n[1]*off;
  return`<ellipse class="${cls}" cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(46*(f1_-f0)/2)}" ry="${w}" transform="rotate(${f1(Math.atan2(u[1],u[0])/R)} ${f1(cx)} ${f1(cy)})"/>`;}
const MUSCLE_SIDE={chest:['t',0.6,0.92,1,4.2],abs:['t',0.1,0.56,1,3.4],obliques:['t',0.14,0.54,0.2,4],lowerback:['t',0.04,0.42,-1,3.6],lats:['t',0.42,0.84,-1,4.4],traps:['t',0.86,1.06,-1,3.2],
  biceps:['ua',0.16,0.84,1],triceps:['ua',0.14,0.86,-1],forearms:['fa',0.08,0.66,0],quads:['th',0.1,0.9,1],hamstrings:['th',0.14,0.9,-1],calves:['sh',0.06,0.55,-1]};
function musclesSide(ex,J,seg){let s=''; const lvl=m=>ex.primary.includes(m)?'mp':(ex.secondary||[]).includes(m)?'ms':null;
  for(const m of [...ex.secondary||[],...ex.primary]){const c=lvl(m), d=MUSCLE_SIDE[m];
    if(m==='shoulders'&&seg==='arm') s+=`<circle class="${c}" cx="${f1(J.sho[0])}" cy="${f1(J.sho[1])}" r="6"/>`;
    if(m==='glutes'&&seg==='torso'){const g=[J.hip[0]-J.n[0]*6.5+J.u[0]*1,J.hip[1]-J.n[1]*6.5+J.u[1]*1]; s+=`<circle class="${c}" cx="${f1(g[0])}" cy="${f1(g[1])}" r="6.2"/>`;}
    if(!d) continue;
    if(d[0]==='t'&&seg==='torso') s+=torsoBelly(J,d[1],d[2],d[3],d[4],c);
    if(d[0]==='ua'&&seg==='arm') s+=belly(J.sho,J.elb1,d[1],d[2],d[3],4.6,c);
    if(d[0]==='fa'&&seg==='arm') s+=belly(J.elb1,J.hand1,d[1],d[2],d[3],3.6,c);
    if(d[0]==='th'&&seg==='leg') s+=belly(J.hip,J.knee1,d[1],d[2],d[3],6.6,c);
    if(d[0]==='sh'&&seg==='leg') s+=belly(J.knee1,J.ank1,d[1],d[2],d[3],4.8,c);}
  return s;}
function plateAt(p,r=16){return`<circle class="plate" cx="${f1(p[0])}" cy="${f1(p[1])}" r="${r}"/><circle class="pring" cx="${f1(p[0])}" cy="${f1(p[1])}" r="${r-5}"/><circle class="hub" cx="${f1(p[0])}" cy="${f1(p[1])}" r="3.2"/>`;}
function dbEnd(p){const pts=[...Array(6)].map((_,i)=>[p[0]+6.2*Math.cos(i*60*R),p[1]+6.2*Math.sin(i*60*R)]); return`<path class="iron" d="M${pts.map(q=>f1(q[0])+' '+f1(q[1])).join('L')}Z"/><circle class="hub" cx="${f1(p[0])}" cy="${f1(p[1])}" r="2"/>`;}
function propsSide(ex,J,front){let s=''; for(const pr of ex.props||[]){const[k,...a]=pr;
  if(front!==(k==='roller'||k==='kneepad'||k==='padfront')) continue;
  if(k==='bench'){const[x,y,w]=a; s+=`<rect class="prop" x="${x}" y="${y}" width="${w}" height="7" rx="3.5"/><rect class="prop2" x="${x+8}" y="${y+7}" width="4" height="${189-y}"/><rect class="prop2" x="${x+w-12}" y="${y+7}" width="4" height="${189-y}"/><rect class="prop2" x="${x+3}" y="189" width="14" height="3" rx="1.5"/><rect class="prop2" x="${x+w-17}" y="189" width="14" height="3" rx="1.5"/>`;}
  if(k==='chair'){const[x,y,w,side]=a, bx=side==='L'?x:x+w-4; s+=`<rect class="prop2" x="${x+3}" y="${y}" width="4" height="${192-y}"/><rect class="prop2" x="${x+w-7}" y="${y}" width="4" height="${192-y}"/><rect class="prop2" x="${bx}" y="${y-46}" width="4" height="46"/><rect class="prop" x="${bx-3}" y="${y-48}" width="10" height="20" rx="3"/><rect class="prop" x="${x}" y="${y}" width="${w}" height="6" rx="2.5"/>`;}
  if(k==='table'){const[x,y,w]=a; s+=`<rect class="prop2" x="${x+6}" y="${y}" width="5" height="${192-y}"/><rect class="prop2" x="${x+w-11}" y="${y}" width="5" height="${192-y}"/><rect class="prop" x="${x}" y="${y}" width="${w}" height="7" rx="2"/>`;}
  if(k==='wall'){const[x]=a, l=x<120; s+=`<rect class="wall" x="${l?x-14:x}" y="-26" width="14" height="218"/><line class="edge" x1="${x}" y1="-26" x2="${x}" y2="192"/>`;}
  if(k==='bar'){const[y]=a; s+=`<line class="post" x1="52" y1="-26" x2="52" y2="${y}"/><line class="post" x1="196" y1="-26" x2="196" y2="${y}"/><line class="barl" x1="46" y1="${y}" x2="202" y2="${y}"/>`;}
  if(k==='dipbar'){const h=J.hand1; s+=`<line class="post" x1="${f1(h[0]+26)}" y1="${f1(h[1]+5)}" x2="${f1(h[0]+26)}" y2="192"/><line class="barl" x1="${f1(h[0]-30)}" y1="${f1(h[1]+5)}" x2="${f1(h[0]+34)}" y2="${f1(h[1]+5)}"/>`;}
  if(k==='tower'){const[x,y]=a, h=J.hand1; s+=`<rect class="wall" x="${x}" y="-26" width="16" height="218" rx="2"/><line class="cable" x1="${x+2}" y1="${y}" x2="${f1(h[0])}" y2="${f1(h[1])}"/><circle class="iron" cx="${x+2}" cy="${y}" r="5.5"/><circle class="hub" cx="${x+2}" cy="${y}" r="1.8"/>`;}
  if(k==='cable'){const[x,y]=a, h=J.hand1; s+=`<line class="cable" x1="${x}" y1="${y}" x2="${f1(h[0])}" y2="${f1(h[1])}"/><circle class="iron" cx="${x}" cy="${y}" r="5.5"/><circle class="hub" cx="${x}" cy="${y}" r="1.8"/>`;}
  if(k==='treadmill'){s+=`<rect class="prop2" x="196" y="96" width="5" height="92" rx="2"/><rect class="prop" x="184" y="88" width="26" height="12" rx="3"/><line class="rail" x1="198" y1="124" x2="160" y2="124"/><rect class="prop" x="36" y="184" width="172" height="7" rx="3.5"/><circle class="hub" cx="42" cy="187.5" r="2.4"/><circle class="hub" cx="202" cy="187.5" r="2.4"/>`;}
  if(k==='bike'){const[sx,sy,cx,cy,bx,by]=a; s+=`<line class="rail" x1="${sx}" y1="${sy+6}" x2="${cx}" y2="${cy}"/><line class="rail" x1="${cx}" y1="${cy}" x2="${bx-4}" y2="${by+8}"/><line class="rail" x1="${sx-6}" y1="189" x2="${bx+30}" y2="189"/><line class="rail" x1="${sx+2}" y1="${sy+6}" x2="${sx+8}" y2="189"/><circle class="iron" cx="${bx+16}" cy="${cy-6}" r="22"/><circle class="hub" cx="${bx+16}" cy="${cy-6}" r="3"/><line class="rail" x1="${bx+16}" y1="${cy+16}" x2="${bx+18}" y2="189"/><rect class="prop" x="${sx-14}" y="${sy}" width="28" height="7" rx="3.5"/><line class="rail" x1="${bx-4}" y1="${by+8}" x2="${bx+4}" y2="${by}"/><circle class="prop" cx="${cx}" cy="${cy}" r="5"/>`;
    const th=Math.atan2(J.ank1[1]-cy,J.ank1[0]-cx); s+=`<line class="rail" x1="${f1(cx+Math.cos(th)*17)}" y1="${f1(cy+Math.sin(th)*17)}" x2="${f1(cx-Math.cos(th)*17)}" y2="${f1(cy-Math.sin(th)*17)}"/>`;}
  if(k==='rower'){const h=J.hand1; s+=`<line class="rail" x1="26" y1="182" x2="214" y2="182"/><rect class="prop2" x="30" y="182" width="5" height="9"/><rect class="prop2" x="200" y="160" width="6" height="31"/><circle class="iron" cx="200" cy="150" r="17"/><circle class="hub" cx="200" cy="150" r="3"/><line class="cable" x1="186" y1="148" x2="${f1(h[0])}" y2="${f1(h[1])}"/><rect class="prop" x="146" y="160" width="8" height="22" rx="3" transform="rotate(-24 150 171)"/><rect class="prop" x="${f1(J.hip[0]-13)}" y="${f1(J.hip[1]+5)}" width="26" height="5" rx="2.5"/>`;}
  if(k==='elliptical'){const p=[176,182]; s+=`<rect class="prop" x="70" y="185" width="126" height="6" rx="3"/><rect class="prop2" x="182" y="104" width="5" height="82" rx="2"/><rect class="prop" x="172" y="96" width="24" height="10" rx="3"/><line class="rail" x1="${p[0]}" y1="${p[1]}" x2="${f1(J.hand2[0])}" y2="${f1(J.hand2[1])}" opacity=".5"/><line class="rail" x1="${p[0]}" y1="${p[1]}" x2="${f1(J.hand1[0])}" y2="${f1(J.hand1[1])}"/>`;
    for(const i of [2,1]){const a1=J['ank'+i]; s+=cap([a1[0]-10,a1[1]+5],[a1[0]+14,a1[1]+5],3,3,'iron');}}
  if(k==='mat') s+=`<rect class="mat" x="6" y="188.5" width="228" height="3.5" rx="1.75"/>`;
  if(k==='seat'){const[x,y,w]=a; s+=`<rect class="prop2" x="${x+w/2-3}" y="${y+7}" width="6" height="${185-y}"/><rect class="prop2" x="${x+w/2-16}" y="189" width="32" height="3" rx="1.5"/><rect class="prop" x="${x}" y="${y}" width="${w}" height="8" rx="4"/>`;}
  if(k==='back'){const[x,y,h,top]=a; s+=`<rect class="prop" x="${x-4}" y="${top}" width="8" height="${y-top}" rx="4"/>`;}
  if(k==='incl'){const[x1,y1,x2,y2]=a; s+=cap([x1,y1],[x2,y2],5,5,'prop')+`<rect class="prop2" x="${x1-10}" y="${y1}" width="4" height="${192-y1}"/>`;}
  if(k==='footplate'){const[x]=a; s+=`<rect class="prop" x="${x}" y="142" width="6" height="40" rx="2"/><rect class="prop2" x="${x-4}" y="182" width="14" height="10"/>`;}
  if(k==='sled'){const ank=J.ank1, dir=[0.77,-0.64], pp=[-dir[1],dir[0]]; s+=`<line class="rail" x1="96" y1="178" x2="222" y2="72"/>`+cap([ank[0]+dir[0]*6+pp[0]*18,ank[1]+dir[1]*6+pp[1]*18],[ank[0]+dir[0]*6-pp[0]*18,ank[1]+dir[1]*6-pp[1]*18],3.5,3.5,'iron');}
  if(k==='hyper'){s+=`<line class="rail" x1="40" y1="190" x2="40" y2="${f1(J.ank1[1]+8)}"/><line class="rail" x1="40" y1="190" x2="120" y2="190"/><line class="rail" x1="40" y1="${f1(J.ank1[1]+8)}" x2="120" y2="${f1(J.hip[1]+16)}"/><line class="rail" x1="120" y1="${f1(J.hip[1]+16)}" x2="120" y2="190"/><circle class="prop" cx="${f1(J.hip[0]+4)}" cy="${f1(J.hip[1]+10)}" r="8"/>`;}
  if(k==='roller'){const off=a[1]||[0,0], p=J.ank1; s+=`<circle class="iron" cx="${f1(p[0]+off[0])}" cy="${f1(p[1]+off[1])}" r="6"/><circle class="hub" cx="${f1(p[0]+off[0])}" cy="${f1(p[1]+off[1])}" r="1.8"/>`;}
  if(k==='kneepad'){const p=J.knee1; s+=`<circle class="iron" cx="${f1(p[0]+1)}" cy="${f1(p[1]-9)}" r="6"/>`;}
 }
 if(ex.id==='backext'||ex.id==='legcurl'){} return s;}
function figureSide(ex,J,ghost){
  const B=ghost?'gh':'sb', F=ghost?'gh':'sk';
  let s=cap(J.hip,J.knee2,7,5.4,B)+cap(J.knee2,J.ank2,5.2,3.6,B)+cap(J.heel2,J.toe2,3,2.2,B);
  s+=cap(J.sho,J.elb2,4.8,3.8,B)+cap(J.elb2,J.hand2,3.6,2.9,B);
  s+=torsoPath(J,F)+(ghost?'':musclesSide(ex,J,'torso'));
  s+=cap(J.hip,J.knee1,7.6,5.6,F)+cap(J.knee1,J.ank1,5.4,3.8,F)+cap(J.heel1,J.toe1,3.1,2.3,F)+(ghost?'':musclesSide(ex,J,'leg'));
  s+=cap(J.sho,J.neck,4,3.6,F)+`<circle class="${F}" cx="${f1(J.head[0])}" cy="${f1(J.head[1])}" r="9.6"/>`;
  if(!ghost){const e=[J.head[0]+J.n[0]*4.6-J.u[0]*0.5,J.head[1]+J.n[1]*4.6-J.u[1]*0.5]; s+=`<circle class="eye" cx="${f1(e[0])}" cy="${f1(e[1])}" r="1.25"/>`;}
  s+=cap(J.sho,J.elb1,5,4,F)+cap(J.elb1,J.hand1,3.8,3,F)+(ghost?'':musclesSide(ex,J,'arm'));
  return s;}
function heldSide(ex,J){const h=ex.held; if(!h) return '';
  if(h==='barbell'){const at=ex.at, p=at==='back'?[J.sho[0]-J.n[0]*9+J.u[0]*3,J.sho[1]-J.n[1]*9+J.u[1]*3]:at==='hip'?[J.hip[0],J.hip[1]-14]:J.hand1; return plateAt(p);}
  if(h==='dumbbell') return dbEnd(J.hand2)+dbEnd(J.hand1);
  if(h==='dumbbell1') return dbEnd(J.hand1);
  if(h==='goblet'){const p=J.hand1; return`<rect class="iron" x="${f1(p[0]-6)}" y="${f1(p[1]-13)}" width="12" height="7" rx="2"/><rect class="iron" x="${f1(p[0]-1.5)}" y="${f1(p[1]-7)}" width="3" height="12"/><rect class="iron" x="${f1(p[0]-6)}" y="${f1(p[1]+4)}" width="12" height="7" rx="2"/>`;}
  if(h==='handle'){const p=J.hand1; return`<circle class="iron" cx="${f1(p[0])}" cy="${f1(p[1])}" r="3.4"/>`;}
  return '';}
function shadowSide(ex,J){if(ex.noFloor) return ''; const xs=[J.toe1[0],J.toe2[0],J.heel1[0],J.heel2[0]]; let cx=(Math.min(...xs)+Math.max(...xs))/2, rx=Math.max(26,(Math.max(...xs)-Math.min(...xs))/2+14);
  if(J.hip[1]>165){cx=(J.head[0]+J.toe1[0])/2; rx=Math.abs(J.head[0]-J.toe1[0])/2+10;}
  return`<ellipse class="shadow" cx="${f1(cx)}" cy="192" rx="${f1(rx)}" ry="3.6"/>`;}

/* ---------- Front view ---------- */
function solveFront(p){const hip=[120,112], tl=p.tilt||0, up=[Math.sin(tl*R),-Math.cos(tl*R)], sd=[Math.cos(tl*R),Math.sin(tl*R)];
  const c=[hip[0]+up[0]*44,hip[1]+up[1]*44-(p.sy||0)], sL=[c[0]-sd[0]*19,c[1]-sd[1]*19], sR=[c[0]+sd[0]*19,c[1]+sd[1]*19];
  const neck=[hip[0]+up[0]*52,hip[1]+up[1]*52-(p.sy||0)*0.3], head=[hip[0]+up[0]*63,hip[1]+up[1]*63], ab=p.ab, eb=p.eb||0;
  const eL=[sL[0]-Math.sin(ab*R)*30,sL[1]+Math.cos(ab*R)*30], hL=[eL[0]-Math.sin((ab+eb)*R)*27,eL[1]+Math.cos((ab+eb)*R)*27];
  const eR=[sR[0]+Math.sin(ab*R)*30,sR[1]+Math.cos(ab*R)*30], hR=[eR[0]+Math.sin((ab+eb)*R)*27,eR[1]+Math.cos((ab+eb)*R)*27];
  return{hip,up,sd,c,sL,sR,neck,head,eL,hL,eR,hR,hpL:[hip[0]-10,hip[1]+2],hpR:[hip[0]+10,hip[1]+2],kL:[hip[0]-12,151],kR:[hip[0]+12,151],aL:[hip[0]-13,184],aR:[hip[0]+13,184]};}
function figureFront(ex,J){const lv=m=>ex.primary.includes(m)?'mp':(ex.secondary||[]).includes(m)?'ms':null, P=(f,o)=>[J.hip[0]+J.up[0]*46*f+J.sd[0]*o,J.hip[1]+J.up[1]*46*f+J.sd[1]*o];
  let s=cap(J.hpL,J.kL,7.6,5.6,'sk')+cap(J.kL,J.aL,5.4,3.8,'sk')+cap(J.hpR,J.kR,7.6,5.6,'sk')+cap(J.kR,J.aR,5.4,3.8,'sk');
  s+=cap(J.aL,[J.aL[0]-9,J.aL[1]+4],3,2.4,'sk')+cap(J.aR,[J.aR[0]+9,J.aR[1]+4],3,2.4,'sk');
  const tor=[P(-0.04,-14),P(0.4,-11.5),P(0.78,-17),J.sL,[J.sL[0]+J.up[0]*3,J.sL[1]+J.up[1]*3],[J.sR[0]+J.up[0]*3,J.sR[1]+J.up[1]*3],J.sR,P(0.78,17),P(0.4,11.5),P(-0.04,14)];
  s+=`<path class="sk" stroke-linejoin="round" d="M${tor.map(q=>f1(q[0])+' '+f1(q[1])).join('L')}Z"/>`;
  const el=(p,rx,ry,c,rot=0)=>c?`<ellipse class="${c}" cx="${f1(p[0])}" cy="${f1(p[1])}" rx="${rx}" ry="${ry}" transform="rotate(${f1(rot+(Math.atan2(J.sd[1],J.sd[0])/R))} ${f1(p[0])} ${f1(p[1])})"/>`:'';
  s+=el(P(0.78,-7.5),6.5,4.6,lv('chest'))+el(P(0.78,7.5),6.5,4.6,lv('chest'))+el(P(0.36,0),4,10,lv('abs'))+el(P(0.34,-9.5),2.6,8,lv('obliques'))+el(P(0.34,9.5),2.6,8,lv('obliques'));
  if(lv('traps')) s+=cap([J.neck[0]-3,J.neck[1]+3],[J.sL[0]+5,J.sL[1]-1],2.8,2.6,lv('traps'))+cap([J.neck[0]+3,J.neck[1]+3],[J.sR[0]-5,J.sR[1]-1],2.8,2.6,lv('traps'));
  s+=cap(J.c,J.neck,4.2,3.8,'sk')+`<circle class="sk" cx="${f1(J.head[0])}" cy="${f1(J.head[1])}" r="9.8"/><circle class="eye" cx="${f1(J.head[0]-3.4)}" cy="${f1(J.head[1]-0.5)}" r="1.2"/><circle class="eye" cx="${f1(J.head[0]+3.4)}" cy="${f1(J.head[1]-0.5)}" r="1.2"/>`;
  s+=cap(J.sL,J.eL,5,4,'sk')+cap(J.eL,J.hL,3.8,3,'sk')+cap(J.sR,J.eR,5,4,'sk')+cap(J.eR,J.hR,3.8,3,'sk');
  if(lv('shoulders')) s+=`<circle class="${lv('shoulders')}" cx="${f1(J.sL[0])}" cy="${f1(J.sL[1])}" r="6"/><circle class="${lv('shoulders')}" cx="${f1(J.sR[0])}" cy="${f1(J.sR[1])}" r="6"/>`;
  if(lv('forearms')) s+=belly(J.eL,J.hL,0.1,0.66,0,3.6,lv('forearms'))+belly(J.eR,J.hR,0.1,0.66,0,3.6,lv('forearms'));
  return s;}
function heldFront(ex,J){const db=h=>`<rect class="iron" x="${f1(h[0]-9)}" y="${f1(h[1]-3)}" width="18" height="6" rx="3"/><rect class="iron" x="${f1(h[0]-11)}" y="${f1(h[1]-5)}" width="5" height="10" rx="2"/><rect class="iron" x="${f1(h[0]+6)}" y="${f1(h[1]-5)}" width="5" height="10" rx="2"/>`;
  if(ex.held==='dumbbell') return db(J.hL)+db(J.hR); if(ex.held==='dumbbellR') return db(J.hR);
  if(ex.held==='handle') return`<circle class="iron" cx="${f1(J.hL[0])}" cy="${f1(J.hL[1])}" r="3.4"/><circle class="iron" cx="${f1(J.hR[0])}" cy="${f1(J.hR[1])}" r="3.4"/>`; return '';}
function propsFront(ex,J){if(ex.eq!=='cable') return ''; return`<rect class="wall" x="6" y="-26" width="16" height="218" rx="2"/><rect class="wall" x="218" y="-26" width="16" height="218" rx="2"/><line class="cable" x1="22" y1="2" x2="${f1(J.hL[0])}" y2="${f1(J.hL[1])}"/><line class="cable" x1="218" y1="2" x2="${f1(J.hR[0])}" y2="${f1(J.hR[1])}"/><circle class="iron" cx="22" cy="2" r="5.5"/><circle class="iron" cx="218" cy="2" r="5.5"/>`;}

const VB='0 -26 240 236';
function fitVB(ex){if(ex._vb) return ex._vb; let xs=[],ys=[];
  const add=(p,r=0)=>{xs.push(p[0]-r,p[0]+r); ys.push(p[1]-r,p[1]+r);};
  if(ex.view==='front'){normK(ex).forEach(k=>{const J=solveFront(k); [J.hL,J.hR,J.eL,J.eR].forEach(q=>add(q,10)); add(J.head,12); add(J.aL,10); add(J.aR,10);}); add([120,194]);}
  else for(let i=0;i<8;i++){const J=solveSide(ex,poseAt(ex,i/8)); ['hip','sho','head','knee1','knee2','ank1','ank2','toe1','toe2','hand1','hand2','elb1','elb2'].forEach(k=>add(J[k],k==='head'?12:8));
    if(ex.held==='barbell'){const p=ex.at==='back'?J.sho:ex.at==='hip'?J.hip:J.hand1; add(p,18);} if(!ex.noFloor) add([J.hip[0],194]);}
  (ex.props||[]).forEach(pr=>{if(pr[0]==='bench'||pr[0]==='chair'||pr[0]==='table'){add([pr[1],pr[2]-(pr[0]==='chair'?50:0)]); add([pr[1]+pr[3],194]);} if(pr[0]==='seat') {add([pr[1],pr[2]]); add([pr[1]+pr[3],194]);}
    const box={treadmill:[[34,86],[212,194]],rower:[[24,130],[220,194]],elliptical:[[68,94],[198,194]],bike:[[80,70],[198,194]]}[pr[0]]; if(box) box.forEach(q=>add(q));});
  let x0=Math.max(0,Math.min(...xs)-10), x1=Math.min(240,Math.max(...xs)+10), y0=Math.max(-26,Math.min(...ys)-10), y1=Math.min(210,Math.max(...ys)+6);
  const A=240/224; let w=x1-x0, h=y1-y0; if(w/h<A){const nw=h*A; x0-= (nw-w)/2; w=nw;} else {const nh=w/A; y0-=(nh-h)/2; h=nh;}
  if(w<130){const k=130/w; x0-=(w*k-w)/2; y0-=(h*k-h)/2; w*=k; h*=k;}
  return ex._vb=[x0,y0,w,h].map(v=>v.toFixed(1)).join(' ');}
function figSVG(ex,ph,opt={}){
  if(ex.custom) return`<svg viewBox="0 0 240 210" class="fg" aria-hidden="true">${miniMapInner(ex)}</svg>`;
  let s='';
  if(ex.view==='front'){const J=solveFront(poseAt(ex,ph)); s=`<line class="floor" x1="6" y1="192" x2="234" y2="192"/><ellipse class="shadow" cx="120" cy="192" rx="34" ry="3.6"/>`+propsFront(ex,J)+figureFront(ex,J)+heldFront(ex,J);}
  else{const J=solveSide(ex,poseAt(ex,ph));
    s=(ex.noFloor?'':`<line class="floor" x1="6" y1="192" x2="234" y2="192"/>`)+shadowSide(ex,J)+propsSide(ex,J,false);
    if(opt.ghost!==false&&ex.K.length===2){const G=solveSide(ex,normK(ex)[ph<0.5?1:0]); s+=`<g opacity=".1">${figureSide(ex,G,true)}</g>`;}
    s+=figureSide(ex,J,false)+heldSide(ex,J)+propsSide(ex,J,true);}
  return`<svg viewBox="${fitVB(ex)}" class="fg" aria-hidden="true">${s}</svg>`;}

/* ---------- Body map (anatomical) ---------- */
const BODY={
 front:[{el:'ellipse',cx:80,cy:22,rx:12,ry:14},{el:'path',d:'M74 34 L86 34 L87 44 L73 44 Z'},
  {m:'traps',mir:1,el:'path',d:'M73 41 C70 47 64 50 57 53 L71 53 Z'},
  {m:'shoulders',mir:1,el:'path',d:'M56 53 C45 53 39 62 40 75 C45 73 51 69 57 64 C61 60 61 55 56 53 Z'},
  {m:'chest',mir:1,el:'path',d:'M79.5 55 L63 55 C57 57 56 66 58 76 C62 85 72 88 79.5 84 Z'},
  {m:'biceps',mir:1,el:'path',d:'M43 78 C37 86 36 100 39 110 C43 112 48 110 50 104 C52 94 52 84 48 77 Z'},
  {m:'forearms',mir:1,el:'path',d:'M39 113 C33 123 31 139 33 151 L40 152 C44 140 48 126 48 115 Z'},
  {mir:1,el:'ellipse',cx:36,cy:159,rx:5,ry:7},
  {m:'abs',el:'rect',x:71,y:89,w:8.5,h:12,rx:3},{m:'abs',el:'rect',x:80.5,y:89,w:8.5,h:12,rx:3},{m:'abs',el:'rect',x:71,y:103,w:8.5,h:12,rx:3},{m:'abs',el:'rect',x:80.5,y:103,w:8.5,h:12,rx:3},{m:'abs',el:'rect',x:71,y:117,w:8.5,h:11,rx:3},{m:'abs',el:'rect',x:80.5,y:117,w:8.5,h:11,rx:3},{m:'abs',el:'path',d:'M71 130 L89 130 L87 143 C84 147 76 147 73 143 Z'},
  {m:'obliques',mir:1,el:'path',d:'M61 87 C59 100 59 120 63 138 L69.5 141 L69.5 91 Z'},
  {el:'path',d:'M63 140 L97 140 C97 150 90 160 80 162 C70 160 63 150 63 140 Z'},
  {m:'quads',mir:1,el:'path',d:'M62 149 C56 170 56 200 62 228 C66 234 74 234 78 228 C80 210 80 180 78 160 C74 153 68 149 62 149 Z'},
  {mir:1,el:'ellipse',cx:70,cy:238,rx:6,ry:6},
  {m:'calves',mir:1,el:'path',d:'M62 246 C57 260 59 284 64 300 L72 300 C76 284 77 262 74 246 Z'},
  {mir:1,el:'ellipse',cx:68,cy:309,rx:8,ry:4.5}],
 back:[{el:'ellipse',cx:80,cy:22,rx:12,ry:14},{el:'path',d:'M74 34 L86 34 L87 44 L73 44 Z'},
  {m:'traps',el:'path',d:'M80 38 C88 44 96 48 104 53 L92 61 L80 101 L68 61 L56 53 C64 48 72 44 80 38 Z'},
  {m:'shoulders',mir:1,el:'path',d:'M56 53 C45 53 39 62 40 75 C45 73 51 69 57 64 C61 60 61 55 56 53 Z'},
  {m:'triceps',mir:1,el:'path',d:'M43 78 C37 86 36 100 39 110 C43 112 48 110 50 104 C52 94 52 84 48 77 Z'},
  {m:'lats',mir:1,el:'path',d:'M59 64 L68 62 L78 104 L68 128 C60 116 56 96 57 76 Z'},
  {m:'forearms',mir:1,el:'path',d:'M39 113 C33 123 31 139 33 151 L40 152 C44 140 48 126 48 115 Z'},
  {mir:1,el:'ellipse',cx:36,cy:159,rx:5,ry:7},
  {m:'lowerback',el:'path',d:'M71 104 L89 104 L91 140 L69 140 Z'},
  {m:'glutes',mir:1,el:'path',d:'M64 140 C59 152 61 167 71 171 C77 172 79.5 166 79.5 151 L79.5 140 Z'},
  {m:'hamstrings',mir:1,el:'path',d:'M62 173 C58 192 60 214 64 230 L77 230 C79 210 80 190 79 173 Z'},
  {mir:1,el:'ellipse',cx:71,cy:238,rx:6,ry:6},
  {m:'calves',mir:1,el:'path',d:'M64 244 C56 254 58 276 66 290 C70 292 74 290 76 282 C78 266 77 252 72 244 Z'},
  {mir:1,el:'ellipse',cx:69,cy:309,rx:8,ry:4.5}]};
function shapeSVG(sh,a){if(sh.el==='circle') return`<circle cx="${sh.cx}" cy="${sh.cy}" r="${sh.r}" ${a}/>`; if(sh.el==='rect') return`<rect x="${sh.x}" y="${sh.y}" width="${sh.w}" height="${sh.h}" rx="${sh.rx||3}" ${a}/>`;
  if(sh.el==='ellipse') return`<ellipse cx="${sh.cx}" cy="${sh.cy}" rx="${sh.rx}" ry="${sh.ry}" ${a}/>`; return`<path d="${sh.d}" ${a}/>`;}
function miniMapInner(ex){let s=''; ['front','back'].forEach((side,i)=>{let g='';
  BODY[side].forEach(sh=>{const cls=!sh.m?'mm-base':ex.primary.includes(sh.m)?'mp':(ex.secondary||[]).includes(sh.m)?'ms':'mm-off'; g+=shapeSVG(sh,`class="${cls}"`); if(sh.mir) g+=`<g transform="matrix(-1 0 0 1 160 0)">${shapeSVG(sh,`class="${cls}"`)}</g>`;});
  s+=`<g transform="translate(${30+i*96},6) scale(0.6)">${g}</g>`;}); return s;}

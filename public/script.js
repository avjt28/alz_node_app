let uploadbox = document.getElementById("uploadBox");
const controlsElement = document.getElementsByClassName('control')[0];
// let camera_button = document.querySelector("#start-camera");
let video = document.querySelector("#video");
let click_button = document.querySelector("#click-photo");
let add_button = document.querySelector("#add-photo");
let submit_button = document.querySelector("#submit");
let canvas = document.querySelector("#canvasbg");
let canvasform = document.querySelector('#canvasform');
let canvasimg = document.querySelector('#canvasimg');







////     ////
////     ////
////     ////
/////////////  HAND Gesture + video streaming part of Code and 
/////////////
////     ////
////     ////
////     ////

var tip_cords = [0,0];
let head = "ok";
let count = 0;
async function loadmodel(){
  const tfliteModel = await tflite.loadTFLiteModel('/keypoint_classifier.tflite');
  return tfliteModel;
}
function landmarkCalc(landmarks){
  const landmarksarray = [];
  for (let i=0; i<21 ; i++){
    landmarksarray[i] = [landmarks[i].x, landmarks[i].y]
  }
  return landmarksarray;
}
async function preprocessLandmark(landmarkarr){
    const landmark = landmarkarr;

    var base_x = 0;
    var base_y = 0;
    for (let i=0; i<21; i++){
        if (i===0){
        base_x = landmark[i][0];
        base_y = landmark[i][1];
        }
        landmark[i][0] -= base_x;
        landmark[i][1] -= base_y;
    }
    const landmark1 = [].concat.apply([],landmark);
    const max_value = Math.max.apply(null, landmark1.map(Math.abs));
    for (var i=0; i<42; i++){
        landmark1[i] /= max_value;
        }
    return landmark1;
}
async function getHandGesture(outputTensor){

    const output = await outputTensor.array();
    const array = output[0];
    let max = Math.max(...array);
    let i = array.indexOf(max);

    var gesture = "";

    if (i===0){gesture="open";}else if (i===1){gesture="close";}else if (i===2){gesture="pointer";}else if (i===3){gesture="ok";};

    return gesture;

}
async function onResultsHands(results) {
    // console.log("onResultsHands function is called")
    if (results.multiHandLandmarks && results.multiHandedness) {
        for (let index = 0; index < results.multiHandLandmarks.length; index++) {
        const landmarks = results.multiHandLandmarks[index];
        let input_tensor = tf.tensor([await preprocessLandmark(landmarkCalc(landmarks))]);
        await loadmodel().then(async function (res) {
            var gesture = await getHandGesture(res.predict(input_tensor));
            if (gesture==="close"){gesture="pointer";}
            // console.log(gesture,count);
            if (gesture===head){count+=1;}else{head = gesture; count=0;};
            if (count===25 && gesture=="pointer"){click_button.click(); count=0; tip_cords = [(landmarks[8].x)*224, (landmarks[8].y)*224]};
        }, function (err) {
            console.log(err);
        });
        }
    }
}
const hands = new Hands({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.1/${file}`;
}});
hands.onResults(onResultsHands);

const camera = new Camera(video, {
    onFrame: async () => {
        await hands.send({image: video});
    },
    width: 480,
    height: 480,
    frameRate: 5, // {ideal: 2, max: 5 },
    });
camera.start();
new ControlPanel(controlsElement, {
    selfieMode: false,
    maxNumHands: 2,
    minDetectionConfidence: 0.8,
    minTrackingConfidence: 0.8
})





/////////////
/////////////
////
////
////////      Facial Part of the Code
////////
////
////
////





        
click_button.addEventListener('click', function() {
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
});
add_button.addEventListener('click', function() {
  // console.log("canvasimg:"+canvasimg);
  canvasform.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  // console.log(canvasform.toDataURL());
  canvasimg.value = canvasform.toDataURL();

  //canvas.hidden = false;
  uploadbox.hidden = false;
  video.hidden = true;
  click_button.hidden= true;
  add_button.hidden = true;
  

});
Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(start)

async function start() {
    const labeledFaceDescriptors = await training()     //   loadLabeledImages() // learning
    console.log(labeledFaceDescriptors);
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
    let image
    document.body.append('Loaded')
    click_button.addEventListener('click', async () => {
        if (image) image.remove()

        let photo = document.getElementById("canvasbg")
        

        cocoSsd.load().then( async (model) => {

            model.detect(photo).then(async (predictions) => {
                console.log(predictions);
                
                const no_of_pred = predictions.length

                if (no_of_pred===0){
                    speechSynthesis.speak(new SpeechSynthesisUtterance("Nothing Found"));
                }

                var minimum_dist = Infinity;
                var minimum_dist_object;
                for(let i=0; i<no_of_pred; i++){
                    var object = predictions[i]
                    var object_cords = [object.bbox[0]+((object.bbox[2])/2), object.bbox[1]+(object.bbox[3]/2)];
                    // console.log(object_cords);
                    // console.log(tip_cords);
                    var object_to_tip_dist = (object_cords[0]-tip_cords[0])**2 + (object_cords[1]-tip_cords[1])**2
                    console.log(object_to_tip_dist, object.class);
                    
                    if  (object_to_tip_dist < minimum_dist){
                        minimum_dist = object_to_tip_dist;
                        minimum_dist_object = object;
                    }
                };

                var object = minimum_dist_object;


                if (object.class === 'person'){

                    let photo = document.getElementById("canvasbg")
                    photo.toBlob( async (blob) => {
                        console.log("finding person")
                        image = await faceapi.bufferToImage(blob)
                        console.log("1")
                        const displaySize = { width: image.width, height: image.height }
                        console.log("2")
                        const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors();
                        console.log("3")
                        const resizedDetections = faceapi.resizeResults(detections, displaySize)
                        console.log("4")
                        const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
                        console.log("5")
                        if (results.length===0){speechSynthesis.speak(new SpeechSynthesisUtterance('Could not recognise'));}
                        results.forEach((result, i) => {                
                            let name = result.toString().split(" ")[0];
                            console.log(name);
                            speechSynthesis.speak(new SpeechSynthesisUtterance(name));
                            })
                        window.setTimeout( ()=> {
                            if (image) image.remove()
                        },
                            3000);
                    })
                }else {
                    speechSynthesis.speak(new SpeechSynthesisUtterance(object.class));
                }
                window.setTimeout( ()=> {
                    if (image) image.remove()
                }, 3000);
            });
        });
    });
};

async function training() {
    let train = [];
    for(let i=0; i<friend_info.length; i++) {
      let label = friend_info[i][0];
      let descriptions = [];
      for(let j=0; j<friend_info[i][1].length; j++) {
        const img = await faceapi.fetchImage(friend_info[i][1][j]);
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
        descriptions.push(detections.descriptor);
      }
      train.push(new faceapi.LabeledFaceDescriptors(label, descriptions));
    }
    return train;
  }
  

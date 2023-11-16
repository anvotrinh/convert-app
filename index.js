const path = require("path");
const exec = require("child_process").exec;
const ffmpeg = require("./ffmpeg");
const { ipcRenderer } = require("electron");

const ImageMagickExePath = "D:\\Program Files\\ImageMagick-7.1.1-Q16-HDRI";

//progress
const progress = document.getElementById("progress");
const progressBar = progress.querySelector(".progress-bar");
const errors = document.getElementById("errors");
const convertBtn = document.getElementById("convertBtn");

convertBtn.addEventListener("click", convertFunction);

//drap
let fileList = [];
const dropAera = document.querySelector(".dropAera");
const dragAera = document.querySelector(".dragAera");
const fileText = document.querySelector(".fileText");
function allowDrop(ev) {
  ev.preventDefault();
}

function drop(ev) {
  ev.preventDefault();
  fileList = [];
  fileText.innerHTML = "";
  for (const f of ev.dataTransfer.files) {
    fileList.push(f.path);

    fileText.innerHTML += f.path + "<br>";
  }
  // console.log(fileList);
}

dropAera.addEventListener("drop", drop);
dropAera.addEventListener("dragover", allowDrop);

//image/video convert
let select = document.getElementById("imageTypes");
function imageConvert(outputImageType) {
  let count = 0;

  for (let i = 0; i < fileList.length; i++) {
    if (fileList[i].includes(".")) {
      const inputFilePath = fileList[i];
      // console.log(inputFilePath);
      if (outputImageType !== path.extname(path.join(inputFilePath))) {
        const outputFilePath = path.join(
          path.dirname(path.join(inputFilePath)),
          path.basename(
            path.join(inputFilePath),
            path.extname(path.join(inputFilePath))
          ) + outputImageType
        );

        const command =
          "cd /d " +
          ImageMagickExePath +
          " && magick " +
          inputFilePath +
          " " +
          outputFilePath;
        // console.log(outputFilePath);
        exec(command, function (error, stdout, stderr) {
          console.log("stdout: " + stdout);
          console.log("stderr: " + stderr);
          if (error !== null) {
            console.log("exec error: " + error);
          }

          count += 1;
          progressBar.style.width =
            Math.round((count * 100) / fileList.length).toString() + "%";
          // console.log(
          //   Math.round((count * 100) / fileList.length).toString() + "%"
          // );
          progressBar.innerText = `${count}/${fileList.length}:${Math.round(
            (count * 100) / fileList.length
          ).toString()}%`;
        });
      } else {
        console.log("Please select a different type");
      }
    }
  }
}
function checkIsImage(outputImageType) {
  const imageType = ["jpg", "png"];
  for (let i = 0; i < imageType.length; i++) {
    if (outputImageType.includes(imageType[i])) {
      return true;
    }
  }
  return false;
}

const hideAll = () =>
  [progress, success, errors].forEach((el) => (el.style.display = "none"));
function checkIsVideo(outputImageType) {
  const imageType = ["mov", "mp4"];
  for (let i = 0; i < imageType.length; i++) {
    if (outputImageType.includes(imageType[i])) {
      return true;
    }
  }
  return false;
}

function videoConvert(outputImageType) {
  let count = 0;
  let pctList = [];
  for (let i = 0; i < fileList.length; i++) {
    if (fileList[i].includes(".")) {
      pctList.push(0);
      const inputFilePath = fileList[i];
      console.log(inputFilePath);
      if (outputImageType !== path.extname(path.join(inputFilePath))) {
        const outputFilePath = path.join(
          path.dirname(path.join(inputFilePath)),
          path.basename(
            path.join(inputFilePath),
            path.extname(path.join(inputFilePath))
          ) + outputImageType
        );

        ffmpeg
          .convert(inputFilePath, outputFilePath, outputImageType)
          .progress((pct) => {
            pctList[i] = pct;

            let totalPct = 0;
            for (let j = 0; j < pctList.length; j++) {
              totalPct += pctList[j] / fileList.length;
            }

            progressBar.style.width = `${totalPct}%`;
            progressBar.innerText = `${count}/${fileList.length}:${Math.round(
              totalPct
            )}%`;
          })
          .then(() => {
            count += 1;

            pctList[i] = 100;
            if (count === fileList.length) {
              progressBar.style.width = "100%";
              progressBar.innerText = `${count}/${fileList.length}:100%`;
            }
          })
          .catch((err) => {
            console.error("FFMPEG ERROR:", err);
          });
      } else {
        console.log("Please select a different type");
      }
    }
  }
}
function dragstartFunction(ev) {
  ev.preventDefault();
  console.log(ev);
  // console.log(ev.target);

  // ipcRenderer.send("ondragstart", image.path);
}
function dragoverFunction(ev) {
  ev.preventDefault();
  ev.stopPropagation();
}

function removeAllDragDiv() {
  const alldiv = dragAera.querySelectorAll("div");
  alldiv.forEach((divElement) => divElement.remove());
}

function convertFunction() {
  removeAllDragDiv();
  let value = select.value;
  let outputImageType = "." + value;
  hideAll();
  progressBar.style.width = "0%";
  progress.style.display = "block";

  dragAera.style.display = "block";
  for (let i = 0; i < fileList.length; i++) {
    const newDiv = document.createElement("div");
    newDiv.draggable = true;

    newDiv.innerText = path.join(
      path.dirname(path.join(fileList[i])),
      path.basename(
        path.join(fileList[i]),
        path.extname(path.join(fileList[i]))
      ) + outputImageType
    );
    newDiv.addEventListener("dragstart", (event) => {
      event.preventDefault();
      event.stopPropagation();

      ipcRenderer.send("ondragstart", newDiv.innerText);
    });
    newDiv.addEventListener("dragover", dragoverFunction);

    dragAera.appendChild(newDiv);
  }
  if (checkIsImage(outputImageType)) imageConvert(outputImageType);
  if (checkIsVideo(outputImageType)) videoConvert(outputImageType);
}

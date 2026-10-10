document.addEventListener("DOMContentLoaded", function () {
  var video = document.getElementById("showcase-video");
  var button = document.getElementById("video-load-button");
  var status = document.getElementById("video-load-status");
  if (!video || !button || !status) return;

  var chunks = [
    "audio/video.part-000", "audio/video.part-001", "audio/video.part-002",
    "audio/video.part-003", "audio/video.part-004", "audio/video.part-005",
    "audio/video.part-006", "audio/video.part-007"
  ];

  button.addEventListener("click", async function () {
    if (video.src) {
      try { await video.play(); } catch (error) { /* browser keeps the visible controls available */ }
      return;
    }

    button.disabled = true;
    var buffers = [];
    try {
      for (var index = 0; index < chunks.length; index++) {
        status.textContent = "正在载入视频 " + (index + 1) + " / " + chunks.length + "…";
        var response = await fetch(chunks[index]);
        if (!response.ok) throw new Error("视频片段无法加载");
        buffers.push(await response.arrayBuffer());
      }
      var videoBlob = new Blob(buffers, { type: "video/mp4" });
      video.src = URL.createObjectURL(videoBlob);
      video.load();
      await new Promise(function (resolve, reject) {
        video.addEventListener("loadeddata", resolve, { once: true });
        video.addEventListener("error", reject, { once: true });
      });
      await video.play();
      button.textContent = "重新开始播放";
      button.disabled = false;
      status.textContent = "正在本页播放。你也可以使用播放器控制条暂停、快进或全屏观看。";
    } catch (error) {
      button.disabled = false;
      status.textContent = "视频暂时无法载入，请刷新页面后再次点击播放。";
    }
  });
});

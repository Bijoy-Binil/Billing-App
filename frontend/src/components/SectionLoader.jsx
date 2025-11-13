const SectionLoader = () => (
  <div className="flex justify-center items-center py-10 select-none">
    <video
      src="/Bat Loader.mp4"
      autoPlay
      loop
      muted
      playsInline
      disablePictureInPicture
      disableRemotePlayback
      controlsList="nodownload noremoteplayback noplaybackrate"
      className="w-50 h-50 object-contain opacity-80 pointer-events-none"
      onContextMenu={(e) => e.preventDefault()}
    />
  </div>
);

export default SectionLoader;
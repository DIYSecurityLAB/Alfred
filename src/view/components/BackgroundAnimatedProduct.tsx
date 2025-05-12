export function Background() {
  return (
    <div className="fixed inset-0 -z-10 w-full h-full bg-black overflow-hidden">
      <video
        className="absolute w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/Fundo_SITE_ALFRED.mp4" type="video/mp4" />
      </video>
    </div>
  );
}

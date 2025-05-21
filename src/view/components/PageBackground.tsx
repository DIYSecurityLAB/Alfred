export function PageBackground() {
  return (
    <div className="fixed inset-0 -z-10 w-full h-full bg-black overflow-hidden">
      <img
        src="/fundo2.png"
        alt="Background"
        className="w-full h-full object-cover object-center"
      />
    </div>
  );
}

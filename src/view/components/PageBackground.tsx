import vaultBackground from '../../../public/fundo2.png';

export function PageBackground() {
  return (
    <div className="fixed inset-0 -z-10 w-full h-full bg-black overflow-hidden">
      <img
        src={vaultBackground}
        alt="Background"
        className="w-full h-full object-cover object-center"
      />
    </div>
  );
}

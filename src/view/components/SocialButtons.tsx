import { FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

function SocialButtons() {
  return (
    <>
      {/* Exibição normal para telas grandes */}
      <div className="hidden lg:flex flex-col fixed bottom-8 right-5 ">
        <button
          onClick={() =>
            window.open('https://www.instagram.com/alfredp2p/', '_blank')
          }
          title="Instagram Button"
          className="text-pink-500 rounded-full p-4 text-3xl cursor-pointer hover:text-pink-600"
        >
          <FaInstagram />
        </button>

        <button
          onClick={() => window.open('https://x.com/alfredp2p', '_blank')}
          title="X Button"
          className="text-white rounded-full p-4 text-3xl cursor-pointer hover:text-gray-400"
        >
          <FaXTwitter />
        </button>

        <button
          onClick={() =>
            window.open(
              'https://api.whatsapp.com/send?phone=+5511911872097&text=Ol%C3%A1,%20Tudo%20bem?%0A%0APreciso%20de%20ajuda%20sobre%20os%20produtos...',
              '_blank',
            )
          }
          title="Whatsapp Button"
          className="text-green-500 rounded-full p-4 text-3xl cursor-pointer hover:text-green-600"
        >
          <FaWhatsapp />
        </button>
      </div>

      {/* Centralizado para telas menores */}
      <div className="flex lg:hidden justify-center gap-4 mt-8">
        <button
          onClick={() =>
            window.open('https://www.instagram.com/alfredp2p/', '_blank')
          }
          title="Instagram Button"
          className="text-pink-500 rounded-full p-4 text-3xl cursor-pointer hover:text-pink-600"
        >
          <FaInstagram />
        </button>

        <button
          onClick={() => window.open('https://x.com/alfredp2p', '_blank')}
          title="X Button"
          className="text-white rounded-full p-4 text-3xl cursor-pointer hover:text-gray-400"
        >
          <FaXTwitter />
        </button>

        <button
          onClick={() =>
            window.open(
              'https://api.whatsapp.com/send?phone=+5511911872097&text=Ol%C3%A1,%20Tudo%20bem?%0A%0APreciso%20de%20ajuda%20sobre%20os%20produtos...',
              '_blank',
            )
          }
          title="Whatsapp Button"
          className="text-green-500 rounded-full p-4 text-3xl cursor-pointer hover:text-green-600"
        >
          <FaWhatsapp />
        </button>
      </div>
    </>
  );
}

export default SocialButtons;

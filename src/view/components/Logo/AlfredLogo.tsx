import AlfredWhiteLogo from '@/view/assets/logo/alfred-white-logo.svg';
import AlfredLogoImage from '../../assets/Icone_Logo_Alfred.svg';

export function AlfredLogo() {
  return (
    <div className="flex items-center gap-2">
      <img src={AlfredLogoImage} alt="Ícone Alfred" className="w-16 sm:w-20" />

      <img src={AlfredWhiteLogo} alt="Alfred Logo" className="w-44 sm:w-40" />

      <span className="text-white font-pixelade text-3xl sm:text-3xl leading-tight relative -translate-y-2">
        P2P
      </span>
    </div>
  );
}

import { LanguageSwitcher } from '../../components/LanguageSwitcher/LanguageSwitcher';
import { NavLinks } from './NavLinks';

export default function Header() {
  return (
    <header className="flex flex-col items-center justify-center w-full max-w-[100vw] transition-all duration-300 bg-transparent px-2 sm:px-4 py-2 sm:py-4 text-center">
      <nav
        aria-label="Global"
        className="w-full flex flex-row items-center justify-center flex-wrap gap-y-2"
      >
        <NavLinks isVisible={true} isLargeScreen={false} />

        <LanguageSwitcher
          className="flex justify-center"
          LabelClassName="text-xl sm:text-2xl lg:text-3xl font-pixelade items-center justify-center gap-x-2 font-extralight leading-6"
        />
      </nav>
    </header>
  );
}

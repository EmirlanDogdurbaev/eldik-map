import { Link } from "react-router-dom";
import logo from "../assets/logo.svg";
type LogoProps = {
  className?: string;
};

const Logo = ({ className }: LogoProps) => {
  return (
    <Link to="/" className={className}>
      <img src={logo} alt="logotype" />
    </Link>
  );
};

export default Logo;

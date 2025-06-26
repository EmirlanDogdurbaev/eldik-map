import { Link, useNavigate } from "react-router-dom";
import Logo from "../../ui/Logo";
import Button from "../../ui/Button";
import { useAppDispatch } from "../../store/hooks";
import { logout } from "../../services/authSlice";

const Nav = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  return (
    <header className=" bg-gray-800 sticky top-0 z-5000 shadow-md">
      <nav className=" max-w-[1300px] mx-auto flex items-center justify-between  text-white">
        <Logo className="p-4" />
        <ul className="flex space-x-4">
          <li>
            <Link to="/load" className="p-4">
              Profile
            </Link>
          </li>
          <li>
            <Button
              className="hover:cursor-pointer hover:text-red-500"
              onClick={() => {
                dispatch(logout());
                navigate("/login");
              }}
            >
              Log out
            </Button>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Nav;

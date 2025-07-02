import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import Logo from "../../ui/Logo";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logout } from "../../services/authSlice";

export type UserRole = "admin" | "driver" | "user" | "dispetcher";

export interface NavItem {
  label: string;
  path: string;
  icon?: string; // опционально для иконок
}

export interface RoleNavigationConfig {
  [key: string]: NavItem[];
}

export const NAVIGATION_CONFIG: RoleNavigationConfig = {
  admin: [
    { label: "Админ панель", path: "/admin" },
    { label: "Создать пользователя", path: "/admin/users/create" },
  ],
  dispetcher: [
    { label: "Диспетчерская", path: "/dispatcher" },
    { label: "Машины", path: "/cars" },
    { label: "Отчеты", path: "/report" },
  ],
  user: [
    { label: "Главная", path: "/user/dashboard" },
    { label: "Карта", path: "/map" },
  ],
  driver: [{ label: "Панель водителя", path: "/driver/dashboard" }],
};

const Nav = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Получаем роль пользователя из Redux store
  const userRole = useAppSelector((state) => state.auth.user?.role) as UserRole;

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Получаем навигационные элементы из конфигурации
  const navigationItems = userRole ? NAVIGATION_CONFIG[userRole] || [] : [];

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
    setIsMenuOpen(false);
  };

  const handleMenuItemClick = () => {
    setIsMenuOpen(false);
  };

  // Если пользователь не авторизован, не показываем навигацию
  if (!userRole) {
    return (
      <header className="bg-gray-800 sticky top-0 z-50 shadow-md">
        <nav className="max-w-[1300px] mx-auto flex items-center justify-between text-white">
          <Logo className="p-4" />
        </nav>
      </header>
    );
  }

  return (
    <header className="bg-gray-800 sticky top-0 z-50 shadow-md">
      <nav className="max-w-[1300px] mx-auto flex items-center justify-between text-white">
        <Logo className="p-4" />

        <div className="flex items-center space-x-4 p-4">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex flex-col justify-center items-center w-8 h-8 space-y-1 hover:bg-gray-700 rounded-md p-1 transition-colors duration-200"
              aria-label="Открыть меню"
              aria-expanded={isMenuOpen}
            >
              <span
                className={`block w-6 h-0.5 bg-white transition-all duration-300 ${
                  isMenuOpen ? "rotate-45 translate-y-2" : ""
                }`}
              ></span>
              <span
                className={`block w-6 h-0.5 bg-white transition-all duration-300 ${
                  isMenuOpen ? "opacity-0" : ""
                }`}
              ></span>
              <span
                className={`block w-6 h-0.5 bg-white transition-all duration-300 ${
                  isMenuOpen ? "-rotate-45 -translate-y-2" : ""
                }`}
              ></span>
            </button>

            <div
              className={`absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-[5000] border border-gray-200 transition-all duration-200 ${
                isMenuOpen
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95 pointer-events-none"
              }`}
            >
              <div className="py-1 ">
                {/* Информация о роли пользователя */}
                <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-200 bg-gray-50">
                  <span className="font-medium text-gray-700 capitalize">
                    {userRole === "dispetcher"
                      ? "Диспетчер"
                      : userRole === "admin"
                      ? "Администратор"
                      : userRole === "driver"
                      ? "Водитель"
                      : userRole === "user"
                      ? "Пользователь"
                      : userRole}
                  </span>
                </div>

                {/* Навигационные элементы */}
                {navigationItems.length > 0 && (
                  <>
                    {navigationItems.map((item, index) => (
                      <Link
                        key={`${userRole}-${index}`}
                        to={item.path}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
                        onClick={handleMenuItemClick}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <div className="border-t border-gray-200 my-1"></div>
                  </>
                )}

                {/* Кнопка выхода */}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-800 transition-colors duration-150"
                >
                  Выйти
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Nav;

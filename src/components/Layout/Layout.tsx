import Nav from "../Nav/Nav";
import NotificationHandler from "../NotificationHandler/NotificationHandler";
type Props = {
  children?: React.ReactNode;
  className?: string;
};

const Layout: React.FC<Props> = ({ children, className }) => {
  return (
    <div>
      <Nav />
      <NotificationHandler />
      <main className="flex w-full">
        <div className={`${className} mx-auto pb-4`}>{children}</div>
      </main>
    </div>
  );
};
export default Layout;

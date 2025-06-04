import Nav from "../Nav/Nav";

type Props = {
  children?: React.ReactNode;
  className?: string;
};

const Layout = ({ children, className }: Props) => {
  return (
    <div>
      <Nav />
      <main className="flex w-full">
        <div className={className}>{children}</div>
      </main>
    </div>
  );
};

export default Layout;

const AuthLayout = async ({ children }: { children: React.ReactNode }) => {
    return <main className="flex flex-col p-4 lg:p-24 2xl:flex-row">{children}</main>;
};

export default AuthLayout;

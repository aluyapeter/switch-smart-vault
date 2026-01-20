export const Card = ({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) => {
  return (
    <div className="relative overflow-hidden rounded-xl bg-slate-800/50 p-6 backdrop-blur-xl border border-slate-700 shadow-2xl">
      {/* Cool Gradient Glow Effect */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/30 rounded-full blur-3xl pointer-events-none"></div>

      {title && (
        <h2 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          {title}
        </h2>
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
};

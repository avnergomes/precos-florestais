import { TreePine, Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-forest-50 to-wood-50">
      <div className="text-center">
        <div className="relative mb-6">
          <TreePine className="w-16 h-16 text-forest-600 mx-auto" />
          <Loader2 className="w-8 h-8 text-forest-500 animate-spin absolute -bottom-2 -right-2" />
        </div>
        <h2 className="text-xl font-semibold text-neutral-800 mb-2">
          Carregando dados...
        </h2>
        <p className="text-neutral-500">
          Preparando o dashboard de preços florestais
        </p>
      </div>
    </div>
  );
}

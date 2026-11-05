import { useState } from "react";
import { isSafeImageSrc } from "../../utils/isSafeImageSrc";

// Mostra a imagem. Se não existir, for insegura ou falhar ao carregar,
// mostra o `fallback` no lugar. ...rest repassa className, loading etc.
function SafeImage({ src, alt, fallback = null, ...rest }) {
  // Guardamos QUAL src falhou (e não só "falhou: true").
  // Assim, se o src mudar, a nova imagem ganha uma chance de carregar.
  const [failedSrc, setFailedSrc] = useState(null);

  if (!isSafeImageSrc(src) || failedSrc === src) return fallback;

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer" // alguns sites bloqueiam imagens quando sabem de onde vem o pedido
      onError={() => setFailedSrc(src)}
      {...rest}
    />
  );
}

export default SafeImage;
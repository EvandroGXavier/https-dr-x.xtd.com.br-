import { useState } from "react";

export function useUploadSeguro({ maxMB = 5, mimeStartsWith = "image/" } = {}) {
  const [erro, setErro] = useState<string | null>(null);
  
  const validar = (file: File) => {
    setErro(null);
    if (!file.type.startsWith(mimeStartsWith)) {
      setErro("Arquivo inválido: tipo não permitido.");
      return false;
    }
    if (file.size > maxMB * 1024 * 1024) {
      setErro(`Arquivo muito grande (máx. ${maxMB}MB).`);
      return false;
    }
    return true;
  };
  
  return { validar, erro };
}

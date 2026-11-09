import { useRef, useState } from "react";
import Button from "../ui/Button";

const formatarTamanho = (bytes) =>
  bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

// Área de upload do print da tela inicial. Aceita 3 jeitos de enviar:
//   1) clicar (ou Enter/Espaço, pelo teclado);  2) arrastar e soltar;  3) colar com Ctrl+V.
// É um componente "burro": o processamento da imagem acontece no hook (useProjetoForm).
function ImagemUpload({ imagem, erro, processando, onSelecionar, onRemover }) {
  const inputRef = useRef(null);
  const [arrastando, setArrastando] = useState(false);

  const receber = (arquivos) => {
    const arquivo = arquivos?.[0];
    if (arquivo) onSelecionar(arquivo);
  };

  const aoSoltar = (evento) => {
    evento.preventDefault(); // sem isto o navegador abriria a imagem em outra aba
    setArrastando(false);
    receber(evento.dataTransfer.files);
  };

  const aoColar = (evento) => {
    const item = [...(evento.clipboardData?.items ?? [])].find((i) => i.type.startsWith("image/"));
    if (item) {
      evento.preventDefault();
      receber([item.getAsFile()]);
    }
  };

  return (
    <div
      className={`field image-upload ${erro ? "has-error" : ""}`}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => setArrastando(true)}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setArrastando(false);
      }}
      onDrop={aoSoltar}
      onPaste={aoColar}
    >
      {/* O <input> real fica escondido, mas continua focável (teclado e leitor de tela funcionam). */}
      <input
        ref={inputRef}
        id="campo-imagem"
        type="file"
        className="visually-hidden"
        accept="image/png,image/jpeg,image/webp"
        aria-invalid={erro ? "true" : undefined}
        aria-describedby={erro ? "campo-imagem-erro" : "campo-imagem-dica"}
        disabled={processando}
        onChange={(e) => {
          receber(e.target.files);
          e.target.value = ""; // permite escolher o MESMO arquivo de novo depois
        }}
      />

      {imagem ? (
        <div className="image-preview">
          <div className="image-preview__frame">
            <img src={imagem.previewUrl} alt="Prévia do print enviado" />
          </div>
          <div className="image-preview__bar">
            <p className="image-preview__info">
              <span className="image-preview__name">{imagem.nome}</span>
              <span>1280×800 · {formatarTamanho(imagem.tamanho)}</span>
            </p>
            <div className="image-preview__actions">
              <Button variant="ghost" size="sm" disabled={processando} onClick={() => inputRef.current?.click()}>
                Trocar
              </Button>
              <Button variant="ghost" size="sm" disabled={processando} onClick={onRemover}>
                Remover
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <label
          htmlFor="campo-imagem"
          className={`dropzone ${arrastando ? "is-over" : ""} ${processando ? "is-busy" : ""}`}
        >
          <span className="dropzone__icon" aria-hidden="true">
            {processando ? (
              <span className="dropzone__spinner" />
            ) : (
              <svg viewBox="0 0 24 24">
                <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" />
                <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
              </svg>
            )}
          </span>
          <span className="dropzone__title">
            {processando ? "Preparando a imagem…" : "Arraste o print aqui ou clique para escolher"}
          </span>
          <span className="dropzone__text">
            {processando ? "Só um instante." : "Você também pode colar com Ctrl+V."}
          </span>
        </label>
      )}

      {erro ? (
        <p id="campo-imagem-erro" className="field__error">
          <span aria-hidden="true">⚠ </span>
          {erro}
        </p>
      ) : (
        <p id="campo-imagem-dica" className="field__hint">
          PNG, JPG ou WebP, até 12 MB. Usamos a parte de cima da tela, em proporção 16:10. Evite mostrar
          e-mails, senhas ou dados pessoais.
        </p>
      )}
    </div>
  );
}

export default ImagemUpload;
import { Html5Qrcode } from 'html5-qrcode';
import { t } from 'i18next';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FaQrcode } from 'react-icons/fa';
import { toast } from 'react-toastify';

interface QRCodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (value: string) => void;
}

export const QRCodeScanner = ({
  isOpen,
  onClose,
  onScan,
}: QRCodeScannerProps) => {
  // Referência para o HTML5QrCode
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);

  // Estados do scanner
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>(
    [],
  );
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);

  // Função para listar as câmeras disponíveis
  const listCameras = useCallback(() => {
    console.log('Tentando listar câmeras disponíveis...');

    // Primeiro verifica se a API mediaDevices está disponível
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.error('API mediaDevices não suportada neste navegador');
      toast.error(
        'Seu navegador não suporta acesso a câmera. Tente usar outro navegador.',
      );
      onClose();
      return;
    }

    // Solicita permissão de câmera antes de tentar listar
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => {
        // Agora que temos permissão, tentamos listar as câmeras
        Html5Qrcode.getCameras()
          .then((devices) => {
            if (devices && devices.length) {
              console.log(`${devices.length} câmeras encontradas`);

              const formattedDevices = devices.map((device) => ({
                id: device.id,
                label: device.label || `Câmera ${device.id}`,
              }));

              setCameras(formattedDevices);

              // Seleciona a primeira câmera por padrão, mas tenta identificar câmeras traseiras em mobile
              let defaultCamera = formattedDevices[0].id;

              // Em dispositivos móveis, tenta selecionar a câmera traseira automaticamente
              const backCamera = formattedDevices.find(
                (camera) =>
                  camera.label.toLowerCase().includes('back') ||
                  camera.label.toLowerCase().includes('traseira') ||
                  camera.label.toLowerCase().includes('environment'),
              );

              if (backCamera) {
                defaultCamera = backCamera.id;
                console.log(
                  'Câmera traseira encontrada e selecionada automaticamente',
                );
              }

              setSelectedCameraId(defaultCamera);
            } else {
              console.error('Nenhuma câmera encontrada');
              toast.error('Nenhuma câmera encontrada no seu dispositivo.');
              onClose();
            }
          })
          .catch((err) => {
            console.error('Erro ao listar câmeras:', err);
            toast.error(
              'Não foi possível listar as câmeras. Verifique as permissões do navegador.',
            );
            onClose();
          });
      })
      .catch((err) => {
        console.error('Permissão de câmera negada:', err);
        toast.error(
          'Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do seu navegador.',
        );
        onClose();
      });
  }, [onClose]);

  // Função para parar o scanner
  const stopScanner = useCallback(() => {
    console.log('=== PARANDO SCANNER DE QR CODE ===');

    // Liberar recursos da câmera
    const releaseMediaResources = () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then((stream) => {
            stream.getTracks().forEach((track) => {
              track.stop();
            });
            console.log('Recursos da câmera liberados manualmente');
          })
          .catch(() => {
            console.log(
              'Não foi possível acessar a câmera para liberação de recursos',
            );
          });
      }
    };

    // Limpar todos os recursos
    const cleanupResources = () => {
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.clear();
          console.log('Recursos do scanner liberados com sucesso');
        } catch (err) {
          console.log('Erro ao limpar recursos do scanner, prosseguindo', err);
        }
        html5QrCodeRef.current = null;
      }

      setIsScanning(false);
      setCameras([]);
      setSelectedCameraId('');

      // Limpa o elemento DOM do scanner
      const qrElement = document.getElementById('qr-reader');
      if (qrElement) {
        qrElement.innerHTML = '';
      }
    };

    // Tentar parar o scanner se ele existir
    if (html5QrCodeRef.current) {
      try {
        html5QrCodeRef.current
          .stop()
          .then(() => {
            console.log('Scanner parado com sucesso');
            releaseMediaResources();
            cleanupResources();
          })
          .catch((err) => {
            console.log('Scanner não estava em execução:', err);
            releaseMediaResources();
            cleanupResources();
          });
      } catch (err) {
        console.error('Erro crítico ao manipular o scanner:', err);
        releaseMediaResources();
        cleanupResources();
      }
    } else {
      releaseMediaResources();
      cleanupResources();
    }

    onClose();
  }, [onClose]);

  // Função para iniciar o scanner com uma câmera específica
  const startScanning = useCallback(
    (cameraId: string) => {
      console.log(`=== INICIANDO LEITURA COM CÂMERA: ${cameraId} ===`);

      // Verificações de segurança
      if (!html5QrCodeRef.current) {
        console.error('Scanner não foi inicializado corretamente');
        toast.error('Erro ao inicializar o scanner. Tente novamente.');
        stopScanner();
        return;
      }

      if (!document.getElementById('qr-reader')) {
        console.error('Elemento do scanner não encontrado no DOM');
        toast.error('Erro ao inicializar o scanner. Tente novamente.');
        stopScanner();
        return;
      }

      // Iniciar a leitura
      try {
        console.log('Iniciando leitura com a câmera selecionada...');

        // Configurações do scanner
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
          videoConstraints: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'environment',
          },
          formatsToSupport: [0], // QR_CODE
        };

        html5QrCodeRef.current
          .start(
            cameraId,
            config,
            (decodedText) => {
              // QR Code lido com sucesso
              console.log('QR Code lido com sucesso:', decodedText);

              // Chama o callback com o valor lido
              onScan(decodedText);

              // Mostra mensagem de sucesso
              toast.success(
                t('buycheckout.qrCodeSuccess') || 'QR Code lido com sucesso!',
              );

              // Fecha o scanner com um pequeno atraso
              setTimeout(() => {
                stopScanner();
              }, 200);
            },
            (errorMessage) => {
              // Erros não críticos durante a leitura
              console.log(
                'Erro não crítico durante leitura do QR Code:',
                errorMessage,
              );

              // Verifica se é o erro de QR Code não encontrado
              if (
                errorMessage.includes('NotFoundException') ||
                errorMessage.includes('No MultiFormat Readers')
              ) {
                // Esse é um erro normal quando não há QR code visível - não mostrar toast a cada frame
                return;
              }

              // Para outros erros, pode ser útil registrar no console, mas não exibir para o usuário
              // para não sobrecarregar com mensagens
            },
          )
          .catch((error) => {
            console.error('Falha ao iniciar a leitura do QR Code:', error);

            // Verifica se é um erro de NotFoundException (QR Code não encontrado)
            if (
              error.toString().includes('NotFoundException') ||
              error.toString().includes('No MultiFormat Readers')
            ) {
              toast.warning(
                t('buycheckout.qrCodeNotFound') ||
                  'Nenhum QR Code detectado. Certifique-se de que o código está visível e bem iluminado.',
              );
            } else {
              // Outros erros gerais
              toast.error(
                t('buycheckout.qrCodeError') ||
                  'Erro ao ler QR Code. Tente novamente.',
              );
            }

            stopScanner();
          });
      } catch (error) {
        console.error('Erro crítico ao iniciar o scanner:', error);
        toast.error('Falha ao iniciar o leitor de QR Code. Tente novamente.');
        stopScanner();
      }
    },
    [onScan, stopScanner],
  );

  // Efeito para inicializar o scanner quando o componente for montado
  useEffect(() => {
    if (isOpen && scannerRef.current) {
      console.log('=== PREPARANDO INICIALIZAÇÃO DO SCANNER ===');
      setIsScanning(true);

      // Limpar qualquer elemento existente
      const existingReader = document.getElementById('qr-reader');
      if (existingReader) {
        existingReader.innerHTML = '';
      }

      // Liberar recursos da câmera antes de iniciar
      const releaseCameraResources = () => {
        return new Promise<void>((resolve) => {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices
              .getUserMedia({ video: true })
              .then((stream) => {
                stream.getTracks().forEach((track) => {
                  track.stop();
                });
                console.log('Recursos de câmera liberados preventivamente');
                resolve();
              })
              .catch(() => {
                console.log(
                  'Não foi possível acessar a câmera para limpeza prévia',
                );
                resolve();
              });
          } else {
            resolve();
          }
        });
      };

      // Criar nova instância do scanner
      const createScanner = () => {
        const qrElement = document.getElementById('qr-reader');
        if (!qrElement) {
          console.error('Elemento #qr-reader não está disponível');
          setIsScanning(false);
          onClose();
          return;
        }

        try {
          // Limpar qualquer instância existente
          if (html5QrCodeRef.current) {
            try {
              html5QrCodeRef.current.clear();
            } catch {
              // Ignorar erros
            }
            html5QrCodeRef.current = null;
          }

          // Criar nova instância
          console.log('Criando nova instância do scanner...');
          const html5QrCode = new Html5Qrcode('qr-reader');
          html5QrCodeRef.current = html5QrCode;
          console.log('Scanner de QR Code inicializado com sucesso!');

          // Listar câmeras disponíveis
          listCameras();
        } catch (error) {
          console.error('Erro fatal ao criar instância do scanner:', error);
          toast.error(
            'Falha ao inicializar o leitor de QR Code. Tente novamente.',
          );
          setIsScanning(false);
          onClose();
        }
      };

      // Executar a sequência de inicialização
      releaseCameraResources()
        .then(() => {
          setTimeout(createScanner, 500);
        })
        .catch((error) => {
          console.error('Erro durante preparação do scanner:', error);
          toast.error('Erro ao preparar o scanner. Tente novamente.');
          setIsScanning(false);
          onClose();
        });
    }

    // Limpeza ao desmontar o componente
    return () => {
      if (isOpen) {
        stopScanner();
      }
    };
  }, [isOpen, listCameras, onClose, stopScanner]);

  // Efeito para iniciar o scanner quando uma câmera for selecionada
  useEffect(() => {
    if (isScanning && selectedCameraId && html5QrCodeRef.current) {
      console.log(
        `Câmera selecionada alterada para: ${selectedCameraId}, iniciando scanner...`,
      );

      const startTimer = setTimeout(() => {
        if (isScanning && html5QrCodeRef.current) {
          startScanning(selectedCameraId);
        }
      }, 300);

      return () => {
        clearTimeout(startTimer);
      };
    }
  }, [selectedCameraId, isScanning, startScanning]);

  // Se o componente não estiver aberto, não renderizar nada
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
      <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg font-bold flex items-center">
            <FaQrcode className="mr-2 text-[#F39200]" />
            {t('buycheckout.scanQrCode') || 'Escanear QR Code'}
          </h3>
          <button
            onClick={stopScanner}
            type="button"
            className="text-white hover:text-red-500 text-2xl font-bold p-2 transition-colors"
            aria-label="Fechar scanner"
          >
            &times;
          </button>
        </div>

        <div
          id="qr-reader"
          ref={scannerRef}
          className="w-full h-64 border border-gray-700 rounded overflow-hidden"
          style={{ position: 'relative' }}
        ></div>

        {/* Seletor de câmeras (mostrar apenas se houver mais de uma câmera) */}
        {cameras.length > 1 && (
          <div className="mt-4">
            <label className="text-white text-sm block mb-2 font-medium">
              Selecione a câmera:
            </label>
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded"
            >
              {cameras.map((camera) => (
                <option key={camera.id} value={camera.id}>
                  {camera.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <p className="text-white text-sm mt-4 text-center">
          {t('buycheckout.qrCodeInstructions') ||
            'Posicione o QR Code em frente à câmera'}
        </p>
        <p className="text-white text-xs mt-2 text-center opacity-70">
          {t('buycheckout.qrCodeTip') ||
            'Certifique-se de que o QR Code está bem iluminado e estável'}
        </p>
      </div>
    </div>
  );
};

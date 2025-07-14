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
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);

  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>(
    [],
  );
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);

  const listCameras = useCallback(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      toast.error(
        'Seu navegador não suporta acesso a câmera. Tente usar outro navegador.',
      );
      onClose();
      return;
    }

    // Definir configurações para obter permissão da câmera com mais clareza
    const constraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        // Sempre paramos os tracks depois de obter permissão para evitar problemas
        stream.getTracks().forEach((track) => track.stop());

        // Agora listamos as câmeras disponíveis
        Html5Qrcode.getCameras()
          .then((devices) => {
            if (devices && devices.length) {
              const formattedDevices = devices.map((device) => ({
                id: device.id,
                label: device.label || `Câmera ${device.id}`,
              }));

              setCameras(formattedDevices);

              // Tentar identificar a câmera traseira para celulares
              let defaultCamera = formattedDevices[0].id;

              // Em dispositivos móveis, tentar encontrar e selecionar a câmera traseira
              const backCamera = formattedDevices.find(
                (camera) =>
                  camera.label.toLowerCase().includes('back') ||
                  camera.label.toLowerCase().includes('traseira') ||
                  camera.label.toLowerCase().includes('environment') ||
                  camera.label.toLowerCase().includes('rear'),
              );

              if (backCamera) {
                defaultCamera = backCamera.id;
              }

              setSelectedCameraId(defaultCamera);
            } else {
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
        console.error('Erro de permissão da câmera:', err);
        toast.error(
          'Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do seu navegador.',
        );
        onClose();
      });
  }, [onClose]);

  const stopScanner = useCallback(() => {
    const releaseMediaResources = () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then((stream) => {
            stream.getTracks().forEach((track) => {
              track.stop();
            });
          })
          .catch(() => {});
      }
    };

    const cleanupResources = () => {
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.clear();
        } catch {
          /* empty */
        }
        html5QrCodeRef.current = null;
      }

      setIsScanning(false);
      setCameras([]);
      setSelectedCameraId('');

      const qrElement = document.getElementById('qr-reader');
      if (qrElement) {
        qrElement.innerHTML = '';
      }
    };

    if (html5QrCodeRef.current) {
      try {
        html5QrCodeRef.current
          .stop()
          .then(() => {
            releaseMediaResources();
            cleanupResources();
          })
          .catch(() => {
            releaseMediaResources();
            cleanupResources();
          });
      } catch {
        releaseMediaResources();
        cleanupResources();
      }
    } else {
      releaseMediaResources();
      cleanupResources();
    }

    onClose();
  }, [onClose]);

  const startScanning = useCallback(
    (cameraId: string) => {
      if (!html5QrCodeRef.current) {
        toast.error('Erro ao inicializar o scanner. Tente novamente.');
        return;
      }

      if (!document.getElementById('qr-reader')) {
        toast.error('Erro ao inicializar o scanner. Tente novamente.');
        return;
      }

      try {
        // Configurações otimizadas para dispositivos móveis
        const config = {
          fps: 15, // Taxa de quadros mais alta para melhor experiência
          qrbox: {
            width: 250,
            height: 250,
          },
          aspectRatio: 1.0,
          disableFlip: false,
          videoConstraints: {
            width: { min: 640, ideal: 1080, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
            facingMode: 'environment',
          },
          formatsToSupport: [0], // QR_CODE
        };

        html5QrCodeRef.current
          .start(
            cameraId,
            config,
            (decodedText) => {
              onScan(decodedText);
              toast.success(
                t('buycheckout.qrCodeSuccess') || 'QR Code lido com sucesso!',
              );
              setTimeout(() => {
                stopScanner();
              }, 200);
            },
            (errorMessage) => {
              // Ignorar erros normais de escaneamento de QR Code
              if (
                errorMessage.includes('NotFoundException') ||
                errorMessage.includes('No MultiFormat Readers') ||
                errorMessage.includes('No MultiFormat Reader') ||
                errorMessage.includes('QR code parse error') ||
                errorMessage.includes('Scanning paused')
              ) {
                return;
              }

              // Outros erros podem ser registrados sem fechar o scanner
              console.error('Erro no scanner:', errorMessage);
            },
          )
          .catch((error) => {
            const errorStr = error.toString();

            // Não fecha o scanner para erros comuns de detecção
            if (
              errorStr.includes('NotFoundException') ||
              errorStr.includes('No MultiFormat Readers') ||
              errorStr.includes('No MultiFormat Reader') ||
              errorStr.includes('QR code parse error')
            ) {
              return;
            }

            // Para problemas de permissão de câmera em dispositivos móveis
            if (
              errorStr.includes('NotAllowedError') ||
              errorStr.includes('PermissionDenied') ||
              errorStr.includes('Permission denied')
            ) {
              toast.error(
                'Permissão da câmera negada. Por favor, permita o acesso à câmera nas configurações.',
              );
              stopScanner();
              return;
            }

            // Para problemas de indisponibilidade de câmera
            if (
              errorStr.includes('NotFoundError') ||
              errorStr.includes('DevicesNotFound') ||
              errorStr.includes('No camera selected')
            ) {
              toast.error(
                'Nenhuma câmera encontrada ou selecionada. Verifique suas configurações.',
              );
              return;
            }

            // Erros gerais
            toast.error(
              t('buycheckout.qrCodeError') ||
                'Erro ao ler QR Code. Tente novamente.',
            );
          });
      } catch {
        toast.error('Falha ao iniciar o leitor de QR Code. Tente novamente.');
      }
    },
    [onScan, stopScanner],
  );

  useEffect(() => {
    if (isOpen && scannerRef.current) {
      setIsScanning(true);

      const existingReader = document.getElementById('qr-reader');
      if (existingReader) {
        existingReader.innerHTML = '';
      }

      const releaseCameraResources = () => {
        return new Promise<void>((resolve) => {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices
              .getUserMedia({ video: true })
              .then((stream) => {
                stream.getTracks().forEach((track) => {
                  track.stop();
                });
                resolve();
              })
              .catch(() => {
                resolve();
              });
          } else {
            resolve();
          }
        });
      };

      const createScanner = () => {
        const qrElement = document.getElementById('qr-reader');
        if (!qrElement) {
          setIsScanning(false);
          onClose();
          return;
        }

        try {
          if (html5QrCodeRef.current) {
            try {
              html5QrCodeRef.current.clear();
            } catch {
              /* empty */
            }
            html5QrCodeRef.current = null;
          }

          const html5QrCode = new Html5Qrcode('qr-reader');
          html5QrCodeRef.current = html5QrCode;

          listCameras();
        } catch {
          toast.error(
            'Falha ao inicializar o leitor de QR Code. Tente novamente.',
          );
          setIsScanning(false);
          onClose();
        }
      };

      releaseCameraResources()
        .then(() => {
          setTimeout(createScanner, 500);
        })
        .catch(() => {
          toast.error('Erro ao preparar o scanner. Tente novamente.');
          setIsScanning(false);
          onClose();
        });
    }

    return () => {
      if (isOpen) {
        stopScanner();
      }
    };
  }, [isOpen, listCameras, onClose, stopScanner]);

  useEffect(() => {
    if (isScanning && selectedCameraId && html5QrCodeRef.current) {
      // Verificamos se foi encontrada a câmera traseira
      const backCamera = cameras.find(
        (camera) =>
          camera.id === selectedCameraId &&
          (camera.label.toLowerCase().includes('back') ||
            camera.label.toLowerCase().includes('traseira') ||
            camera.label.toLowerCase().includes('environment') ||
            camera.label.toLowerCase().includes('rear')),
      );

      // Determinar o tempo de espera - menor para câmera traseira (comum em celulares)
      const delay = backCamera || cameras.length === 1 ? 800 : 1500;

      // Aumentamos o tempo para dar mais tempo para a inicialização da câmera
      const startTimer = setTimeout(() => {
        if (isScanning && html5QrCodeRef.current) {
          try {
            startScanning(selectedCameraId);
          } catch (error) {
            // Capturamos qualquer erro aqui para evitar que o componente falhe
            console.error('Erro ao iniciar o scanner:', error);
          }
        }
      }, delay);

      return () => {
        clearTimeout(startTimer);
      };
    }
  }, [selectedCameraId, isScanning, startScanning, cameras]);

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

        <div className="relative">
          <div
            id="qr-reader"
            ref={scannerRef}
            className="w-full aspect-square border border-gray-700 rounded overflow-hidden"
            style={{
              position: 'relative',
              maxHeight: '320px',
              margin: '0 auto',
            }}
          ></div>
        </div>

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
      </div>
    </div>
  );
};

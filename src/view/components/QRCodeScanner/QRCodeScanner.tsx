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

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => {
        Html5Qrcode.getCameras()
          .then((devices) => {
            if (devices && devices.length) {
              const formattedDevices = devices.map((device) => ({
                id: device.id,
                label: device.label || `Câmera ${device.id}`,
              }));

              setCameras(formattedDevices);

              let defaultCamera = formattedDevices[0].id;

              const backCamera = formattedDevices.find(
                (camera) =>
                  camera.label.toLowerCase().includes('back') ||
                  camera.label.toLowerCase().includes('traseira') ||
                  camera.label.toLowerCase().includes('environment'),
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
          .catch(() => {
            toast.error(
              'Não foi possível listar as câmeras. Verifique as permissões do navegador.',
            );
            onClose();
          });
      })
      .catch(() => {
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
        stopScanner();
        return;
      }

      if (!document.getElementById('qr-reader')) {
        toast.error('Erro ao inicializar o scanner. Tente novamente.');
        stopScanner();
        return;
      }

      try {
        const config = {
          fps: 10,
          qrbox: 220,
          aspectRatio: 1.0,
          disableFlip: false,
          videoConstraints: {
            width: { ideal: 480 },
            height: { ideal: 480 },
            facingMode: 'environment',
          },
          formatsToSupport: [0],
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
              if (
                errorMessage.includes('NotFoundException') ||
                errorMessage.includes('No MultiFormat Readers')
              ) {
                return;
              }
            },
          )
          .catch((error) => {
            if (
              error.toString().includes('NotFoundException') ||
              error.toString().includes('No MultiFormat Readers')
            ) {
              toast.warning(
                t('buycheckout.qrCodeNotFound') ||
                  'Nenhum QR Code detectado. Certifique-se de que o código está visível e bem iluminado.',
              );
            } else {
              toast.error(
                t('buycheckout.qrCodeError') ||
                  'Erro ao ler QR Code. Tente novamente.',
              );
            }

            stopScanner();
          });
      } catch {
        toast.error('Falha ao iniciar o leitor de QR Code. Tente novamente.');
        stopScanner();
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
        <p className="text-white text-xs mt-2 text-center opacity-70">
          {t('buycheckout.qrCodeTip') ||
            'Certifique-se de que o QR Code está bem iluminado e estável'}
        </p>
      </div>
    </div>
  );
};

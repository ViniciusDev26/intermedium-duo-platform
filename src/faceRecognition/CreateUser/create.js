import React, { useContext, useEffect, useRef, useState } from 'react';
import { Container, TextField, Button, IconButton, Box, Typography, Avatar, Card, CardContent, Grid } from '@mui/material';
import { Delete } from '@mui/icons-material';
import CameraswitchIcon from '@mui/icons-material/Cameraswitch';
import * as faceapi from 'face-api.js';
import Api from 'src/api/service';
import Swal from 'sweetalert2';
import CameraIcon from '@mui/icons-material/Camera';
import ThreeSixtyIcon from '@mui/icons-material/ThreeSixty';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import LogoutSharpIcon from '@mui/icons-material/LogoutSharp';
import CameraRearIcon from '@mui/icons-material/CameraRear';
import { useNavigate } from 'react-router';
import AuthContext from 'src/contexto/AuthContext';


export default function RegistrationForm() {
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [whoCam, setWhoCam] = useState('environment')
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [drivers, setDrivers] = useState([''])
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext)

  async function getCameraStream(cameraId) {
    try {
      const constraints = {
        video: {
          facingMode: cameraId ? { exact: cameraId } : whoCam 
        }
      };
  
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const videoElement = document.querySelector('video');
      videoElement.srcObject = stream;
  
      const devices = await navigator.mediaDevices.enumerateDevices();
      const rearCamera = devices.find(device => device.kind === 'videoinput' && device.label.toLowerCase().includes('back'));
      if (rearCamera) {
        await getCameraStream(rearCamera.deviceId);
      } 
  
    } catch (err) {
      console.error('Erro ao acessar a câmera: ', err);
    }
  }

  function handleRemoveImage(){
    setImagePreview('')
  }

  const capturePhoto = async (event) => {
    event.preventDefault()

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(async (blob) => {
                if (blob) {
                    const bufferImage = await faceapi.bufferToImage(blob);
                    const detections = await faceapi.detectAllFaces(bufferImage, new faceapi.TinyFaceDetectorOptions())
                        .withFaceLandmarks()
                        .withFaceDescriptors();
                    
                    if(detections.length <= 0 ){
                      const htmlContent = `
                      <div style="text-align: center;">
                        <h4>A foto que você retirou não permitiu a leitura das expressões faciais.</h4>
                        <p>Tente tirar a foto novamente.</p>
                      </div>
                    `;
                       await Swal.fire({
                        icon: 'question',
                        html:htmlContent,
                        showDenyButton: false,
                        showCancelButton: false,
                        showConfirmButton: true,
                        confirmButtonText: 'Ok!'
                    })
                      setImage(null)
                      getCameraStream()
                    }
                }
            }, 'image/jpeg');
            
            setImage(canvasRef.current.toDataURL('image/png'));
        }
   
};
 useEffect(() => {
        const loadModels = async () => {
            try {
                const MODEL_URL = '/models';
                await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
                await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
                await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
            } catch (error) {
                console.error('Error loading models:', error);
            }
        };

        loadModels();
    }, []);
  useEffect(() =>{
    getCameraStream()
  },[])


  async function handleSubmit(e) {
        e.preventDefault()
         if (!image || !name || !plate) {
                await Swal.fire({
                    icon: 'info',
                    title: "Preencha todos os campos",
                    showDenyButton: false,
                    showCancelButton: false,
                    showConfirmButton: true,
                    denyButtonText: 'Cancelar',
                    confirmButtonText: 'Confirmar'
                })
                return
            }
        const formData = new FormData();
        formData.append('name', name);
        formData.append('plate', plate);
        formData.append('photo', image);

        try {
            await Api.post('/faceRecognition/create', formData)
            await Swal.fire({
                icon: 'success',
                title: "Motorista cadastrado com sucesso",
                showDenyButton: false,
                showCancelButton: false,
                showConfirmButton: true,
                denyButtonText: 'Cancelar',
                confirmButtonText: 'Confirmar'
            })
            
            setName('')
            setPlate('')
            setImage(null)
            getDrivers()
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: error.response.data.message,
                showDenyButton: false,
                showCancelButton: false,
                showConfirmButton: true,
                denyButtonText: 'Cancelar',
                confirmButtonText: 'Confirmar'
            })

        }
    }

    async function recapture(title){
      const confirm = await Swal.fire({
        icon: 'question',
        title: title,
        showDenyButton: true,
        showCancelButton: false,
        showConfirmButton: true,
        denyButtonText: 'Não',
        confirmButtonText: 'Sim'
    })
    if(!confirm.isConfirmed){
      return
    }
      setImage(null)
      getCameraStream()
    }

    async function getDrivers(){
      try{
        const {data} = await Api.get('/faceRecognition/list')
        setDrivers(data)
      }catch(error){
        console.log(error)
      }
    }

    async function deleteDriver(id){
     const confirm =  await Swal.fire({
        icon: 'question',
        title: "Deseja deletar o motorista?",
        showDenyButton: true,
        showCancelButton: false,
        showConfirmButton: true,
        denyButtonText: 'Cancelar',
        confirmButtonText: 'Deletar'
    })
    if(!confirm.isConfirmed){
      return
    }

      try{
        await Api.post('/faceRecognition/delete',{
          driverId: id
        })
        getDrivers()
      }catch(error){
        console.log(error)
      }
    }


    function Logout() {
      localStorage.clear();
      setUser(null);
      navigate('/auth/login')
      return null
    }

    useEffect(() =>{
      getDrivers()
    },[])

  return (
    <Box style={{ height: '100vh', width: '100%', backgroundColor: '#f0f4f8' }}>
<Grid
  container
  justifyContent="flex-end" 
  alignItems="flex-start"    
  style={{ width: '100%', backgroundColor: '#f0f4f8', padding: '10px' }} 
>
  <Grid item>
    <Button
      variant="contained"
      color="primary"
      component="span"
      size="small"
      onClick={() => navigate('/faceRecoginition/Recognition')}
    >
      <CameraRearIcon />
    </Button>
  </Grid>
  <Grid item>

    <Button
      variant="contained"
      color="primary"
      component="span"
      size="small"
    onClick={Logout}
    >
      <LogoutSharpIcon />
    </Button>
  </Grid>

  
</Grid>
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={2}>

      <Grid item xs={4}>
      <Card variant="outlined" sx={{ height: '100%', p: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Lista de Motoristas
          </Typography>
          <Grid container spacing={2}>
            {drivers.length === 0 ? (
              <Typography variant="body2" color="text.secondary" style={{padding:'20px'}}>
                Nenhum motorista encontrado.
              </Typography>
            ) : (
              drivers.map((driver) => (
                <Grid key={Math.random()} item container  spacing={2} alignItems="center">
                  <Grid item>
                    <Avatar alt={driver.name} src={driver.photo} sx={{ width: 56, height: 56 }} />
                  </Grid>
                  <Grid item xs>

                    <Typography variant="h6">{driver.name} - {driver.plate}</Typography>
                    <Typography variant="body2" style={{fontWeight:'bold'}} color={driver.present ? 'green' : 'red'}>
                      {driver.present ? 'Carregando caminhão' : 'Aguardando'}
                    </Typography>
                  </Grid>
                  <DeleteForeverIcon style={{cursor:'pointer', color:'red'}} onClick={() => deleteDriver(driver.id)}/>
                </Grid>
              ))
            )}
          </Grid>
        </CardContent>
      </Card>
    </Grid>

        <Grid item xs={8}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: 'white',
              p: 3,
              borderRadius: 2,
              boxShadow: 3,
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Foto do Motorista
              </Typography>
              {imagePreview ? (
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={imagePreview}
                    alt="Foto do Motorista"
                    sx={{ width: 120, height: 120, mb: 1, border: '2px solid #1976d2' }}
                  />
                  <IconButton
                    onClick={handleRemoveImage}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      backgroundColor: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      },
                    }}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  {image ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <img src={image} alt="foto capturada" width="100%" height="auto" />
                      <Button variant="contained" color="primary" component="span" size="small" onClick={() => recapture('Deseja retirar a foto novamente?')}>
                        <ThreeSixtyIcon />
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <video ref={videoRef} width="100%" height="auto" autoPlay muted />
                      <canvas
                        ref={canvasRef}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          display: 'none',
                        }}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          component="span"
                          size="small"
                          onClick={() => setWhoCam(whoCam === "environment" ? "user" : "environment")}
                        >
                          <CameraswitchIcon />
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          component="span"
                          size="small"
                          onClick={(e) =>capturePhoto(e)}
                        >
                          <CameraIcon />
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            <TextField
              label="Nome Completo"
              variant="outlined"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ mb: 2 }}
              size="small"
            />

            <TextField
              label="Placa do Carro"
              variant="outlined"
              fullWidth
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              sx={{ mb: 2 }}
              size="small"
            />

            <Button type="submit" variant="contained" color="primary" fullWidth size="large" onClick={(e) =>handleSubmit(e)}>
              Enviar
            </Button>
          </Box>
        </Grid>

       

        
      </Grid>
    </Container>
  </Box>
  );
}

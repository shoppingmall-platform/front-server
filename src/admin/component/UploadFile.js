import { Alert, Button , IconButton} from '@mui/material';
import React, { useState,useRef } from 'react';


const UploadFile = ({maxImages}) => {
    const [images, setImages] = useState([]);
    const [error, setError] = useState(''); 
    const inputRef = useRef(null);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        const currentImageCount = images.length;
        // const maxImages = 10;
        
        // 파일이 maximages 이상일 경우 경고 메시지를 표시
        if (currentImageCount + files.length > maxImages) {
            setError(`최대 ${maxImages}개의 이미지만 업로드할 수 있습니다.`);
            e.target.value = ''; // 입력 초기화
            return;
        } else {
            setError(''); // 경고 메시지 초기화
        }

        const validImages = files.filter(file => file.type.startsWith('image/')).slice(0, maxImages - currentImageCount);

        validImages.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImages(prevImages => [...prevImages, reader.result]);
            };
            reader.readAsDataURL(file); // Convert the image file to base64
        });

        e.target.value = ''; // Clear the input
    };

    const handleRemoveImage = (index) => {
        setImages(prevImages => prevImages.filter((_, i) => i !== index));
    };
    const handleButtonClick = () => {
        if (inputRef.current) {
            inputRef.current.click();
        }
    };

    return (
        <div>
            <input 
                type="file" 
                accept="image/*" 
                multiple
                onChange={handleImageChange} 
                ref={inputRef}
                style={{display:'none'}}
            />
            <Button 
            variant="outlined" 
            size='small'
            color="primary" 
            onClick={handleButtonClick}
            sx={{margin:1}}>
                파일 선택
            </Button>
            {/* 경고 메시지 표시 */}
            {error && <Alert severity="error" variant="outlined">{error}</Alert>}
            
            <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
                {images.map((image, index) => (
                    <div key={index} style={{ position: 'relative', flexDirection: 'column', margin: '5px' }}>
                        <img 
                            src={image} 
                            alt={`preview-${index}`} 
                            style={{ width: '100px', height: '100px', objectFit: 'cover' }} 
                        />
                        <IconButton onClick={() => handleRemoveImage(index)}  sx={{position:'absolute', top:'0px', right:'6px'}} size="small">
                            &times;
                        </IconButton>

                    </div>
                ))}
            </div>
        </div>
    );
};

export default UploadFile;

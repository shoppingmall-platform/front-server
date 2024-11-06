import { Alert, Button, IconButton } from '@mui/material';
import React, { useState, useRef } from 'react';
import AWS from 'aws-sdk';

AWS.config.update({
    region: process.env.REACT_APP_awsRegion,
    credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId:process.env.REACT_APP_awsIdentityPoolId,
    }),
});

const s3 = new AWS.S3();

const UploadFile = ({ maxImages }) => {
    const [images, setImages] = useState([]);
    const [error, setError] = useState('');
    const inputRef = useRef(null);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        const currentImageCount = images.length;

        if (currentImageCount + files.length > maxImages) {
            setError(`최대 ${maxImages}개의 이미지만 업로드할 수 있습니다.`);
            e.target.value = '';
            return;
        } else {
            setError('');
        }

        const validImages = files.filter((file) => file.type.startsWith('image/')).slice(0, maxImages - currentImageCount);

        validImages.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImages((prevImages) => [...prevImages, { file, preview: reader.result }]);
            };
            reader.readAsDataURL(file);
        });

        e.target.value = '';
    };

    const handleRemoveImage = (index) => {
        setImages((prevImages) => prevImages.filter((_, i) => i !== index));
    };

    const handleButtonClick = () => {
        if (inputRef.current) {
            inputRef.current.click();
        }
    };

    const saveEventHandler = async () => {
        try {
            const uploadedUrls = await Promise.all(
                images.map(async ({ file }) => {
                    const params = {
                        Bucket: process.env.REACT_APP_bucketName,
                        Key: `uploads/${Date.now()}-${file.name}`,
                        Body: file,
                        ContentType: file.type,
                        
                    };

                    const { Location } = await s3.upload(params).promise();
                    return Location;
                })
            );
            
            console.log('Uploaded URLs:', uploadedUrls);
        } catch (err) {
            console.error('S3 Upload Error:', err);
            setError('이미지 업로드 중 오류가 발생했습니다.');
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
                style={{ display: 'none' }}
            />
            <Button
                variant="outlined"
                size="small"
                color="primary"
                onClick={handleButtonClick}
                sx={{ margin: 1 }}
            >
                파일 선택
            </Button>
            {error && <Alert severity="error" variant="outlined">{error}</Alert>}
            <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
                {images.map(({ preview }, index) => (
                    <div key={index} style={{ position: 'relative', flexDirection: 'column', margin: '5px' }}>
                        <img
                            src={preview}
                            alt={`preview-${index}`}
                            style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                        />
                        <IconButton
                            onClick={() => handleRemoveImage(index)}
                            sx={{ position: 'absolute', top: '0px', right: '6px' }}
                            size="small"
                        >
                            &times;
                        </IconButton>
                    </div>
                ))}
            </div>
            <Button onClick={saveEventHandler} sx={{ marginLeft: '80%' }}>저장</Button>
        </div>
    );
};

export default UploadFile;


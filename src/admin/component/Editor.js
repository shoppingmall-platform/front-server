import { Button } from '@mui/material';
import React, { useState, useMemo, useRef } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ImageResize from 'quill-image-resize';
import AWS from 'aws-sdk';



if (!Quill.imports['modules/imageResize']) {
    Quill.register('modules/imageResize', ImageResize);
  }

AWS.config.update({
    region: process.env.REACT_APP_awsRegion,
    credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId:process.env.REACT_APP_awsIdentityPoolId,
    }),
});

const s3 = new AWS.S3();

const EditorBox = () => {
    const [value, setValue] = useState('');
    const quillRef = useRef();

    const handleSubmit = async () => {
        const editorContent = quillRef.current.getEditor().root.innerHTML;
        const images = editorContent.match(/(<img[^>]*src\s*=\s*[\"']?([^>\"']+)[\"']?[^>]*>)/g) || [];
        const updatedContent = await handleImageUpload(images, editorContent);
        console.log("서버로 보낼 HTML:", updatedContent); //나중에 여기다가 서버로 보내기, 함수는 따로 작성
    };

    const handleImageUpload = async (images, editorContent) => {
        for (let image of images) {
            const base64Src = image.match(/src="([^"]+)"/)[1]; 
            const blob = base64ToBlob(base64Src);
            const imageUrl = await uploadImage(blob);
            editorContent = editorContent.replace(base64Src, imageUrl);
        }
        return editorContent;
    };
    const base64ToBlob = (base64) => {
        const byteCharacters = atob(base64.split(',')[1]);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            byteArrays.push(new Uint8Array(byteNumbers));
        }
        return new Blob(byteArrays, { type: 'image/jpeg' }); 
    };

    const uploadImage = async (blob) => {
        try {
            const params = {
                Bucket: process.env.REACT_APP_bucketName,
                Key: `uploads/${Date.now()}`,  
                Body: blob,                   
                ContentType: blob.type       
            };
            const { Location } = await s3.upload(params).promise();
            return Location; 
        } catch (err) {
            console.error('S3 Upload Error:', err);
            throw new Error('이미지 업로드 중 오류가 발생했습니다.');
        }
    };

    const formats = [
        "header", "bold", "italic", "underline", "strike", "blockquote", "list",
        "bullet", "indent", "link", "image", "video", 'font', 'float', 'align',
        'height', 'width','color', 'background'
    ];

    const modules = useMemo(() => {
        return {
            toolbar: {
                container: [
                    [{ 'font': [] }],
                    [{ header: [1,2,3,4,5,6,false] }],
                    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                    [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
                    ['link', 'image', 'video'],
                    [{ align: [] }, { color: [] }, { background: [] }],
                    ['clean'],
                ]
            },
            imageResize: {
                displayStyles: {
                    backgroundColor: 'black',
                    border: 'none',
                    color: 'white'
                },
                modules: [ 'Resize', 'DisplaySize', 'Toolbar' ]
            }
        }
    }, []);

    const onChangeValue = (e) => {
        console.log(e);
        setValue(e);
    };

    return (
        <div>
            <ReactQuill
                value={value}
                theme="snow"
                ref={quillRef}
                onChange={onChangeValue}
                formats={formats}
                modules={modules}
                style={{ height: 400, overflowY: 'auto' }}
            />
            <Button onClick={handleSubmit}>저장</Button>
        </div>
    );
};

export default EditorBox;

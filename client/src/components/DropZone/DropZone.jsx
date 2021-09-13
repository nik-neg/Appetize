import React, { useState } from "react";
import './index.css';
import { DropzoneDialogBase } from 'material-ui-dropzone';
import IconButton from '@material-ui/core/IconButton';
import { useSelector, useDispatch } from 'react-redux';
import { uploadImageBeforePublish } from '../../store/userSlice';

export default function DropZone (props) {
  const [fileObjects, setFileObjects] = useState([]);
  const dialogTitle = () => (
    <>
      <span>Upload file</span>
      <IconButton
        style={{right: '12px', top: '8px', position: 'absolute'}}
        onClick={() => props.setOpen(false)}>
      </IconButton>
    </>
  );

  const asyncWrapper = async (dispatch, asyncFunc, data) => {
    await dispatch(asyncFunc(data));
  }

  const dispatch = useDispatch();
  const userData = {...useSelector((state) => state.user.userData)};
  const baseUrl = 'http://localhost:3001';
  let imageURL = `${baseUrl}/profile/${userData._id}/download?created=`

  const handleUpload = async () => {
    props.setImagePath('');
    const newCreatedImageDate = new Date().getTime();
    imageURL += newCreatedImageDate;
    await asyncWrapper(dispatch, uploadImageBeforePublish, {userId: userData._id, file: fileObjects['0'], newCreatedImageDate});
    props.setImagePath(imageURL);
  }

  const handleDelete = deleted => {
    setFileObjects(fileObjects.filter(f => f !== deleted));
  };

  return (
    <div>
      <DropzoneDialogBase
        dialogTitle={dialogTitle()}
        acceptedFiles={['image/*']}
        fileObjects={fileObjects}
        cancelButtonText={"cancel"}
        submitButtonText={"submit"}
        maxFileSize={5000000}
        filesLimit={1}
        open={props.open}
        onAdd={(newFileObjs) => {
          setFileObjects(newFileObjs);
        }}
        onDelete={handleDelete}
        onClose={() => props.setOpen(false)}
        onSave={ async () => {
          await handleUpload();
          props.setOpen(false);
        }}
        showPreviews={true}
        showFileNamesInPreview={true}
      />
      </div>
  );
}

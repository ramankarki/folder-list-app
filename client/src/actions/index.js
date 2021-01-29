import axios from "axios";
import {
  FETCH_USER,
  ACTIVE_ACTION_DROPDOWN,
  ON_MODAL_TITLE_CHANGE,
  ON_MODAL_DESC_CHANGE,
  FETCH_FOLDERS,
  FOLDER_MODAL_STATE,
  ERROR,
  FETCH_FOLDER,
} from "./types";
import { errorCreator } from "./helper";
import {
  folderRequestLoading,
  exitFolderModal,
  todoListRequestLoading,
} from "./helper";

export const errorDestroyer = () => {
  return {
    type: ERROR,
    payload: null,
  };
};

export const fetchUser = () => async (dispatch) => {
  const user = await axios.get("/auth/google/status");

  dispatch({ type: FETCH_USER, payload: user.data });
};

export const activeDropdown = (elementID) => (dispatch, getState) => {
  const activeDropdown = getState().activeDropdown;

  if (elementID === activeDropdown) {
    dispatch({ type: ACTIVE_ACTION_DROPDOWN, payload: null });
  } else {
    dispatch({ type: ACTIVE_ACTION_DROPDOWN, payload: elementID });
  }
};

export const onModalFieldChange = (type, value) => {
  if (type === "title") {
    return {
      type: ON_MODAL_TITLE_CHANGE,
      payload: value,
    };
  } else if (type === "desc") {
    return {
      type: ON_MODAL_DESC_CHANGE,
      payload: value,
    };
  }
};

export const createFolder = (title, desc) => async (dispatch, getState) => {
  if (!title) {
    errorCreator(
      "Create Folder Failed !",
      `Empty string is not a valid name.`,
      dispatch
    );
    return;
  }
  const description = desc ? desc : undefined;
  let folder;
  folderRequestLoading(true, dispatch);

  try {
    folder = await axios.post("/api/v1/folder", { title, description });
    dispatch({
      type: FETCH_FOLDERS,
      payload: [...getState().folders, folder.data.folder],
    });
    folderRequestLoading(false, dispatch);
    exitFolderModal(dispatch);
  } catch (err) {
    errorCreator(
      "Create Folder Failed !",
      `May be folder with "${title}" name already exists or connection lost`,
      dispatch
    );
    folderRequestLoading(false, dispatch);
  }
};

export const fetchFolders = () => async (dispatch) => {
  const folders = await axios.get("/api/v1/folder");

  dispatch({ type: FETCH_FOLDERS, payload: folders.data.folders });
};

export const updateFolder = (id, data) => async (dispatch, getState) => {
  if (!data.title) {
    errorCreator(
      "Update Folder Failed !",
      `Empty string is not a valid name.`,
      dispatch
    );
    return;
  }
  let updatedFolder;
  folderRequestLoading(true, dispatch);

  try {
    updatedFolder = await axios.patch(`/api/v1/folder/${id}`, data);
    const oldFolders = getState().folders;
    const newFolder = oldFolders.map((folder) => {
      if (folder._id === id) {
        return updatedFolder.data.folder;
      }
      return folder;
    });

    dispatch({ type: FETCH_FOLDERS, payload: newFolder });
    folderRequestLoading(false, dispatch);
    exitFolderModal(dispatch);
  } catch (err) {
    errorCreator(
      "Update Folder Failed !",
      `May be folder with "${data.title}" name already exists or connection lost`,
      dispatch
    );
    return folderRequestLoading(false, dispatch);
  }
};

export const folderModalState = (state) => {
  return {
    type: FOLDER_MODAL_STATE,
    payload: state,
  };
};

export const deleteFolder = () => async (dispatch, getState) => {
  const id = getState().folderModalState.split("-")[1];
  folderRequestLoading(true, dispatch);

  try {
    await axios.delete(`/api/v1/folder/${id}`);

    // stop loading spinner
    folderRequestLoading(false, dispatch);

    // remove delete folder
    let folders = getState().folders;
    folders = folders.filter((folder) => folder._id !== id);

    // dispatch updated folders
    dispatch({ type: FETCH_FOLDERS, payload: folders });

    // exit modal
    exitFolderModal(dispatch);
  } catch (err) {
    folderRequestLoading(false, dispatch);
    errorCreator(
      "Delete Folder Failed !",
      "Connection lost. try again !",
      dispatch
    );
  }
};

export const fetchFolder = (doc, id) => async (dispatch) => {
  if (!doc) {
    folderRequestLoading(true, dispatch);

    const folder = await axios.get(`/api/v1/folder/${id}`);
    dispatch({
      type: FETCH_FOLDER,
      payload: folder.data.folder,
    });
    folderRequestLoading(false, dispatch);
  } else {
    dispatch({
      type: FETCH_FOLDER,
      payload: doc,
    });
  }
};

export const createTodoItem = (id, todoItem) => async (dispatch, getState) => {
  todoListRequestLoading("create", dispatch);

  let { listData } = getState().activeTodoList;
  listData = [...listData, todoItem];
  let updatedFolder;

  updatedFolder = await axios.patch(`/api/v1/folder/${id}`, { listData });

  dispatch({ type: FETCH_FOLDER, payload: updatedFolder.data.folder });

  todoListRequestLoading(false, dispatch);
};

export const deleteTodoItem = (id, itemIndex) => async (dispatch, getState) => {
  let { listData } = getState().activeTodoList;
  listData = [
    ...listData.slice(0, itemIndex),
    ...listData.slice(itemIndex + 1),
  ];
  let updatedFolder;
  todoListRequestLoading("delete", dispatch);

  updatedFolder = await axios.patch(`/api/v1/folder/${id}`, { listData });

  dispatch({ type: FETCH_FOLDER, payload: updatedFolder.data.folder });

  todoListRequestLoading(false, dispatch);
};

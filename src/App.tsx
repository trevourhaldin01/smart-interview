

import React, { useState, useEffect, useReducer,  useRef, useCallback } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { addUser, deleteUser, updateUser, setUsers } from "./store/userSlice";
import useLocalStorage from "./hooks/useLocalStorage";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button, Table, Form} from "react-bootstrap";
import { User } from "./types";
import { RootState } from "./store/store";
import toast, { Toaster } from "react-hot-toast";

const API_URL = "https://jsonplaceholder.typicode.com/users";

interface Action {
  type: "SET_FIELD" | "RESET";
  field?: keyof User;
  value?: any;
}

const initialState = {id:0, name: "", email: "", phone: "" };

function formReducer(state: User, action:Action):User {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field!]: action.value };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

const App = () => {
  const [users, setUsersState] = useLocalStorage("users", []);
  const [formState, dispatchForm] = useReducer(formReducer, initialState);
  const [editId, setEditId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const usersFromStore = useSelector((state: RootState) => state.users.list);
  const [filteredUsers, setFilteredUsers] = useState<User[]>(usersFromStore);
  const [error, setError] = useState<string | null>(null); 

  const fetchUsers = async () => {
    // Fetch users from the API
    try {
      const { data } = await axios.get(API_URL); 
      setUsersState(data); 
      dispatch(setUsers(data)); // Dispatch users to Redux
    } catch (error) {
      console.error("Failed to fetch users:", error); 
      toast.error("Failed to fetch users");
    }
  };

  useEffect(() => {
    const localData = localStorage.getItem("users"); 
     
    if (!localData) {
      fetchUsers();

    }else {
      try {
        const parsedData = JSON.parse(localData);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          setUsersState(parsedData); // Update local storage state
          dispatch(setUsers(parsedData)); // Load into Redux
        } else {
          console.log("....parse data is empty or invalid")
          fetchUsers(); // Run fetch if parsed data is empty or not an array
        }
      } catch (error) {
        console.error("Error parsing localStorage data:", error);
        fetchUsers(); //call api if error parsing data
      }
      
    } 
  }, [dispatch]);
  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formState.name || !formState.email){
      setError("Name and Email are required");
      return;
    }

    //validate email using regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formState.email)) {
      setError("Please enter a valid email address");
      return;
    }

    //if editId is not null, the user with the editId will be updated 
    //if editId is null, this will lead to creation of new user
    if (editId) {
      //edit user
      const updatedUsers = users.map((user:User) =>
        user.id === editId ? { ...user, ...formState } : user
      );
      setUsersState(updatedUsers);
      dispatch(updateUser({ ...formState,id: editId}));
      toast.success("User updated successfully");
    } else {
      //Add new user
      const newUser = {  ...formState ,id: Date.now()};
      setUsersState([...users, newUser]);
      dispatch(addUser(newUser));
      toast.success("User added successfully");
    }
    
    dispatchForm({ type: "RESET" }); //reset form
    setEditId(null);
    setShowModal(false);
  };

  //delete user
  const handleDelete = useCallback((id:number) => {
    const confrimDelete = window.confirm("Are you sure you want to delete this user?"); //sets a confirmation for a user deletion
    if (!confrimDelete) return; //stops the function
    const filteredUsers = users.filter((user:User) => user.id !== id);
    setUsersState(filteredUsers);
    dispatch(deleteUser(id));
    toast.success("User deleted successfully");
  }, [users]);

  const handleEdit = (user:User) => {
    dispatchForm({ type: "SET_FIELD", field: "name", value: user.name });
    dispatchForm({ type: "SET_FIELD", field: "email", value: user.email });
    dispatchForm({ type: "SET_FIELD", field: "phone", value: user.phone });
    setEditId(user.id);
    setShowModal(true);
  };

  const filterUsers = useCallback(() => {
    const searchTerm = searchRef.current?.value.toLowerCase() || "";
    const filtered = usersFromStore.filter((user) =>
      user.name.toLowerCase().includes(searchTerm)
    );
    setFilteredUsers(filtered);
  }, [usersFromStore]);

  useEffect(() => {
    setFilteredUsers(usersFromStore); // Ensure filtered users update when usersFromStore changes
  }, [usersFromStore]);



  return (
    <div className="container mt-4">
      <h1>React CRUD App</h1>
      <input ref={searchRef} onChange={filterUsers} className="form-control mb-3" placeholder="Search users..." />
      <Button variant="primary" onClick={() => setShowModal(true)}>Add User</Button>
      <Table striped bordered hover className="mt-3">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.phone}</td>
              <td>
                <Button variant="success" size="sm" onClick={() => handleEdit(user)}>Edit</Button>{" "}
                <Button variant="danger" size="sm" onClick={() => handleDelete(user.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editId ? "Edit User" : "Add User"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <p className="text-danger">{error}</p>}
          <Form onSubmit={handleSubmit}>
            <Form.Group>
              <Form.Label>Name</Form.Label>
              <Form.Control required placeholder="Name" value={formState.name} onChange={(e) => dispatchForm({ type: "SET_FIELD", field: "name", value: e.target.value })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Email</Form.Label>
              <Form.Control required placeholder="Email" value={formState.email} onChange={(e) => dispatchForm({ type: "SET_FIELD", field: "email", value: e.target.value })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Phone</Form.Label>
              <Form.Control required placeholder="Phone" value={formState.phone} onChange={(e) => dispatchForm({ type: "SET_FIELD", field: "phone", value: e.target.value })} />
            </Form.Group>
            <Button className="mt-3" variant="success" type="submit">{editId ? "Update" : "Add"} User</Button>
          </Form>
        </Modal.Body>
      </Modal>
      <Toaster />
    </div>
  );
};

export default App;

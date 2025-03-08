import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { User } from '../types';

interface UserState {
    list: User[];
}
const userSlice = createSlice({
    name: 'users',
    initialState: {
        list: []
    } as UserState,
    reducers:{
        setUsers:(state, action:PayloadAction<User[]>)=>{
            state.list = action.payload;
        },
        addUser: (state, action:PayloadAction<User>)=>{
            state.list.push(action.payload);
        },
        updateUser: (state, action:PayloadAction<User>)=>{
            const index = state.list.findIndex(user => user.id === action.payload.id);
            if (index !== -1) {
                state.list[index] = { ...state.list[index], ...action.payload };
            }
        },
        deleteUser: (state, action: PayloadAction<any>)=>{
            state.list = state.list.filter((user)=> user.id !== action.payload);
            
        }
    }
});

export const { setUsers, addUser, updateUser, deleteUser } = userSlice.actions;
export default userSlice.reducer;


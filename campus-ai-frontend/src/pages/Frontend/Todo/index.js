import React, { useState } from 'react'

let initialState = {
    title : "",
    description : "",
    date : ""
}

export default function Todo() {
    const [formState,setFormState] = useState(initialState)
    const [todos,setTodos] = useState([])
    const [selectedTodo,setSelectedTodo] = useState(null)
    const [isRemoveModelOpen,setIsRemoveModelOpen] = useState(false)
    const [isUpdateModelOpen,setIsUpdateModelOpen] = useState(false)
    const handleChange = e => setFormState(s => ({...s,[e.target.name] : e.target.value}))
    const handleSubmit = () => {
      setTodos([...todos,formState])
      setFormState(initialState)
    }
    const openRemoveModal = index => {
      setSelectedTodo(index)
      setIsRemoveModelOpen(true)

    }
    const openUpdateModal = index => {
      setSelectedTodo(index)
      setFormState(todos[index])
      setIsUpdateModelOpen(true)

    }
    const removeTodo = () => {
      let updatedTodo = todos.filter((_,i) => i !== selectedTodo )
      setTodos(updatedTodo)
      setSelectedTodo(null)
      setIsRemoveModelOpen(false)
    }
    
    const updateTodo = () => {
      let updatedTodo = todos.map((todo,i) => i === selectedTodo ? formState : todo)
      setTodos(updatedTodo)
      setIsUpdateModelOpen(false)
      setSelectedTodo(null)
      setFormState(initialState)
    }

  return (
    <>
    
    <main className="container py-5">
        <div className="row">
          <div className="col">
            <h1 className="text-center mb-4">Todo</h1>
            <div className="card mx-auto p-4 border-0" style={{ maxWidth: 300 }}>
              <div className="row">
                <div className="col-12 mb-3">
                  <input type="text" value={formState.title} name="title" placeholder='Enter Your Title: ' className='form-control' onChange={handleChange} />
                </div>
                <div className="col-12 mb-3">
                <input type="text" value={formState.description} name="description" placeholder='Enter Your Description: ' className='form-control' onChange={handleChange} />
                </div>
                <div className="col-12 mb-3">
                <input type="date" name="date" value={formState.date} placeholder='Enter Your Date: ' className='form-control' onChange={handleChange} />
                </div>
                <div className="col-12 mb-3 text-center">
                  <button className="btn btn-primary w-100" onClick={handleSubmit}>Add Todo</button>
                </div>
              </div>
            </div>
            <h2 className="text-center">Todo List</h2>
            <table className="table text-center">
                <thead>
                    <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {todos.map((todo,i) => {
                        return <tr key={i}>
                        <th>{i + 1} </th>
                        <td>{todo.title} </td>
                        <td>{todo.description} </td>
                        <td>{todo.date} </td>
                        <td>
                            <button className="btn btn-danger me-2" onClick={() => openRemoveModal(i)}>Remove</button>
                            <button className="btn btn-success" onClick={() => openUpdateModal(i)} >Update</button>
                        </td>
                        </tr>
                    })}
                </tbody>
            </table>
          </div>
        </div>
        {isRemoveModelOpen && (
          <div class="modal show d-block" tabindex="-1">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Remove Todo</h5>
                <button type="button" class="btn-close" onClick={() => setIsRemoveModelOpen(false)}></button>
              </div>
              <div class="modal-body">
                <p>MAre you sure you want to remove this todo.</p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary" onClick={removeTodo}>Remove Todo</button>
              </div>
            </div>
          </div>
        </div>
        )}
        {isUpdateModelOpen && (
          <div class="modal show d-block" tabindex="-1">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Update Todo</h5>
                <button type="button" class="btn-close" onClick={() => setIsUpdateModelOpen(false)}></button>
              </div>
              <div class="modal-body">
                <div className="mb-3">
                <input type="text" name="title" value={formState.title} placeholder='Enter Your Title: ' className='form-control' onChange={handleChange} />
                </div>
                <div className="mb-3">
                <input type="text" name="description" value={formState.description} placeholder='Enter Your description: ' className='form-control' onChange={handleChange} />
                </div>
                <div className="mb-3">
                <input type="date" name="date" value={formState.date} placeholder='Enter Your Date: ' className='form-control' onChange={handleChange} />
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onClick={() => setIsUpdateModelOpen(false)} >Close</button>
                <button type="button" class="btn btn-primary" onClick={updateTodo}>Update Todo</button>
              </div>
            </div>
          </div>
        </div>
        )}

    </main> 
    </>
  )
}

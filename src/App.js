import './App.css';
import React, {Fragment as F} from 'react';

export default class App extends React.Component {
  state = {
    todos: [
      {text: "Cook karambwans", id: 1}, 
      {text: "Pet otter", id: 2},
      {text: "Lunch with Shrek", id:3}
    ],
    dragging: {},
    currentTodo: ""
  };

  dragStart = idx => e => {
    const {top, left} = e.target.getBoundingClientRect();
    const mouseOffset = {x: e.clientX - left, y: e.clientY - top};

    this.setState({dragging: {idx, initialY: e.clientY - e.target.offsetHeight / 3, height: e.target.offsetHeight, mouseOffset}});
    window.addEventListener('mousemove', this.dragMove, {passive: true});
    window.addEventListener('mouseup', this.dragEnd);
  };

  clamp = (value, min, max) => Math.min(Math.max(min, value), max);

  dragMove = e =>
    this.setState(state => {
      const {dragging: {idx, mouseOffset: {x: mx, y: my}, initialY, height}} = state;
      const diffIdx = Math.round((e.clientY - initialY) / height);

      state.todos[idx].drag = {x: e.clientX - mx, y: e.clientY - my};
      state.dragging.diffIdx = diffIdx;
      state.dragging.clamped = this.clamp(idx + diffIdx, 0, state.todos.length - 1);

      return state;
    });

  dragEnd = e => {
    window.removeEventListener('mousemove', this.dragMove, {passive: true});
    window.removeEventListener('mouseup', this.dragEnd);

    this.setState(state => {
      const {dragging: {idx, clamped}} = state;

      delete state.todos[idx].drag;
      state.dragging = {};
      if (!isNaN(clamped)) state.todos.splice(clamped, 0, state.todos.splice(idx, 1)[0]);

      return state;
    });
  };

  finishTodo = idx => e => {
    const {clientX, clientY, target} = e;
    const {top, left} = target.getBoundingClientRect();
    this.setState(state => {
      state.todos[idx].done = !state.todos[idx].done;

      if (state.todos[idx].done) {
        state.todos[idx].circle = {x: clientX - left, y: clientY - top};
      } else {
        delete state.todos[idx].circle;
      }
      return state;
    });
  };

 
  renderTodo = ({text, id, done, deleteTodo, circle, drag: {x, y} = {}}, idx) => {
    const classes = ['task'];
    if (x && y) classes.push('dragging');
    if (done) classes.push('done');

    const style = x && y ? {top: y, left: x} : {};

    return (
      <F key={id}>  
        {y && <div className="task filler" />}
        <div className={classes.join(' ')} style={style} onMouseDown={this.dragStart(idx)} onClick={this.finishTodo(idx)}>
          <div className="task-circle-effect" style={circle && {top: circle.y, left: circle.x}} />
          <span>{text}</span>
  	  <button onClick={this.deleteTodo(id)}><span>X</span></button>    
        </div>
      </F>
    );
  }

  todosWithIndicator() {
    const {dragging: {idx, diffIdx}, todos} = this.state;
    const todosComponents = todos.map(this.renderTodo);

    if (!isNaN(idx) && !isNaN(diffIdx)) {
      const indicatorIdx = this.clamp(idx + diffIdx, 0, todos.length - 1);
      if (idx !== indicatorIdx)
        todosComponents.splice(
          indicatorIdx + (indicatorIdx > idx ? 1 : 0),
          0,
          <div key="indicator" className="task indicator" />
        );
    }

    return todosComponents;
  }

  onInputChange = event => this.setState({currentTodo: event.target.value});

  addTodo = () => {
    if (this.state.todos.length === 5) {
        this.forceUpdate();
      return;
    }
    if (this.state.currentTodo.replace(/\s+/g, '')) {
      let todosCopy = this.state.todos.slice();

      todosCopy.push({text: this.state.currentTodo, id: this.counter++});
      this.setState({todos: todosCopy, currentTodo: ""});
    }
  }

  deleteAll = () => this.setState({todos: []});

  deleteTodo = id => {
    return  e => {
    let todosCopy = this.state.todos.slice();
    let index = todosCopy.findIndex(todo => todo.id === id);

    todosCopy.splice(index, 1);
    this.setState({todos: todosCopy});
    e.stopPropagation();
    }
  }

  counter = this.state.todos.length +1;

  render() {
    const {currentTodo, todos} = this.state;
    const finished = todos.filter(todo => todo.done);
    const message = todos.length === 0 
      ? 'You still have stuff to do!'
      : (todos.length - finished.length) === 5
      ? 'You are lazy! Get to work!'
      : finished.length === todos.length
        ? 'You are done with all your todos! Yay!'
        : 'You still have stuff to do :(';

    return (
      <div className="container">
        <div className="todo">
          <h1>Todo</h1>
          <div className="actions">
            <input placeholder="Enter todo" value={currentTodo} onChange={this.onInputChange}/>
            <button onClick={this.addTodo}>Add!</button>
            <button className="task-delete" onClick={this.deleteAll}>Delete all!</button>
          </div>
          <div className="task-message">{message}</div>
          {todos.length > 0 && <div className="tasks">{this.todosWithIndicator()}</div>}
        </div>
      </div>
    );
  }
}

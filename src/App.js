import React, { useState } from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import './App.scss';
import 'notyf/notyf.min.css';

import Header from './components/Header/Header';
import JoinPage from './pages/JoinPage';
import RoomPage from './pages/VideoRoomPage';
import NotFoundPage from './pages/NotFoundPage';

const App = () => {
	const [info, setInfo] = useState({});

	const handleSetCredentials = (username, roomId) => {
		username = username.trim();
		roomId = roomId.trim();
        setInfo({username, roomId });
	};
	
	return (
		<BrowserRouter>
			<Header roomId={info.roomId} />
			<div className='app-component'>
				<Switch>
					<Route exact path='/' component={() => <RoomPage username={info.username} roomId={info.roomId} setInfo={setInfo} />} />
					<Route path='/join' component={() => <JoinPage handleSetCredentials={handleSetCredentials} />} />
					<Route component={NotFoundPage} />
				</Switch>
			</div>
		</BrowserRouter>
	);
};

export default App;

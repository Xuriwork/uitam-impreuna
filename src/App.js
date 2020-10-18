import React, { useState } from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import io from 'socket.io-client';

import { socketURL } from './utils/constants';

import Header from './components/Header/Header';
import JoinPage from './pages/JoinPage';
import JoinPageRoomPasscode from './pages/JoinPageRoomPasscode';
import RoomPage from './pages/VideoRoomPage';
import NotFoundPage from './pages/NotFoundPage';
import InvitedPage from './pages/InvitedPage';

import './App.scss';
import 'notyf/notyf.min.css';

const App = () => {
	const socket = io(socketURL, {transports: ['websocket']});
	const [info, setInfo] = useState({});
	const [authorized, setAuthorized] = useState(false);

	const handleSetCredentials = (username, roomName) => {
		username = username.trim();
		roomName = roomName.trim();
        setInfo({ username, roomName });
	};
	
	return (
			<BrowserRouter>
				<Header roomName={info.roomName} />
				<div className='app-component'>
					<Switch>
						<Route
							exact
							path='/'
							component={() => (
								<RoomPage
									username={info.username}
									roomName={info.roomName}
									authorized={authorized}
									setAuthorized={setAuthorized}
								/>
							)}
						/>
						<Route
							path='/invite/:roomId'
							component={() => <InvitedPage socket={socket} />}
						/>
						<Route
							path='/join'
							component={() => (
								<JoinPage
									handleSetCredentials={handleSetCredentials}
									socket={socket}
									setAuthorized={setAuthorized}
								/>
							)}
						/>
						<Route
							path='/enter-passcode'
							component={() => (
								<JoinPageRoomPasscode
									socket={socket}
									setAuthorized={setAuthorized}
									username={info.username}
									roomName={info.roomName}
								/>
							)}
						/>
						<Route component={NotFoundPage} />
					</Switch>
				</div>
			</BrowserRouter>
	);
};

export default App;

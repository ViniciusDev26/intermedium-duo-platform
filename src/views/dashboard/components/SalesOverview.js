import AlarmOnIcon from "@mui/icons-material/AlarmOn";
import {
	Box,
	Button,
	Checkbox,
	Chip,
	CircularProgress,
	FormControl,
	FormControlLabel,
	Grid,
	InputLabel,
	MenuItem,
	OutlinedInput,
	Select,
} from "@mui/material";
import { pt } from "date-fns/locale";
import React, { useEffect } from "react";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import DashboardCard from "../../../components/shared/DashboardCard";
import "react-day-picker/dist/style.css";
import Api from "src/api/service";
import ModalSolicitation from "src/components/modal-Solicitation/modal";
import Swal from "sweetalert2";
const SalesOverview = ({ companies }) => {
	const today = new Date();

	const initialDays = [];
	const [days, setDays] = useState(initialDays);
	const minHeight = 6;
	const [objects, setObjects] = useState([]);
	const [places, setPlaces] = useState([]);
	const [users, setUsers] = useState([]);
	const [companySelect, setcompanyIdSelect] = useState("");
	const [objectSelect, setObjectSelect] = useState([]);
	const [placesSelected, setPlacesSelected] = useState("");
	const [userSelected, setUserSelected] = useState("");
	const [repeat, setRepeat] = useState(false);
	const [personName, setPersonName] = React.useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [searchUser, setSeactUser] = useState(false);
	const [objCreateSolicitation, setObjCreateSolicition] = useState({});
	const cellHeight = Math.min(Math.max(minHeight * 5.5));

	async function getUsersForCompany() {
		if (!companySelect) return;

		try {
			const [users, objects, places] = await Promise.all([
				Api.get("/user/recover", {
					params: { companyId: companySelect },
				}),
				Api.get("objects/recover", {
					params: {
						companyId: companySelect,
					},
				}),
				Api.get("place/recover", {
					params: {
						companyId: companySelect,
					},
				}),
			]);
			const objectForSelect = objects.data.map((item) => {
				return { name: item.name, id: item.id };
			});
			setObjects(objectForSelect);
			setPlaces(places.data);

			setUsers(users.data);
		} catch (error) {
			await Swal.fire({
				icon: "error",
				title: "Erro ao recuperar usuários",
				showDenyButton: true,
				showCancelButton: false,
				showConfirmButton: true,
				denyButtonText: "Cancelar",
				confirmButtonText: "Confirmar",
			});
		}
	}
	async function handleCompany(value) {
		setcompanyIdSelect(value);
		setSeactUser(!searchUser);
	}

	async function handleNextPass() {
		setIsLoading(true);
		const newObjects = [];
		for (let i = 0; i < personName.length; i++) {
			const existe = objects.find((item) => item.name === personName[i]);
			newObjects.push(existe.id);
		}
		if (
			newObjects.length === 0 ||
			!placesSelected ||
			!userSelected ||
			days.length === 0 ||
			!companySelect
		) {
			if (!companySelect) {
				await Swal.fire({
					icon: "info",
					title: "Preencha o campo de Empresa",
					showDenyButton: false,
					showCancelButton: false,
					showConfirmButton: true,
					denyButtonText: "Cancelar",
					confirmButtonText: "Confirmar",
				});
			} else if (newObjects.length === 0) {
				await Swal.fire({
					icon: "info",
					title: "Preencha o campo de objeto",
					showDenyButton: false,
					showCancelButton: false,
					showConfirmButton: true,
					denyButtonText: "Cancelar",
					confirmButtonText: "Confirmar",
				});
			} else if (!placesSelected) {
				await Swal.fire({
					icon: "info",
					title: "Preencha o campo de ambiente",
					showDenyButton: false,
					showCancelButton: false,
					showConfirmButton: true,
					denyButtonText: "Cancelar",
					confirmButtonText: "Confirmar",
				});
			} else if (!userSelected) {
				await Swal.fire({
					icon: "info",
					title: "Preencha o campo de operário",
					showDenyButton: false,
					showCancelButton: false,
					showConfirmButton: true,
					denyButtonText: "Cancelar",
					confirmButtonText: "Confirmar",
				});
			} else if (days.length === 0) {
				await Swal.fire({
					icon: "info",
					title: "Informe a data da solicitação",
					showDenyButton: false,
					showCancelButton: false,
					showConfirmButton: true,
					denyButtonText: "Cancelar",
					confirmButtonText: "Confirmar",
				});
			} else {
				await Swal.fire({
					icon: "info",
					title: "Preecha todos os campos",
					showDenyButton: false,
					showCancelButton: false,
					showConfirmButton: true,
					denyButtonText: "Cancelar",
					confirmButtonText: "Confirmar",
				});
			}
			setIsLoading(false);
			return;
		} else {
			handleOpenModal(newObjects);
		}
		setIsLoading(false);
	}

	const [openModal, setOpenModal] = useState(false);
	function handleOpenModal(newObjects) {
		setObjCreateSolicition({
			objects: newObjects,
			places: placesSelected,
			user: userSelected,
			repeat: repeat,
			date: days,
		});
		setOpenModal(!openModal);
	}

	useEffect(() => {
		getUsersForCompany();
	}, [searchUser]);

	const ITEM_HEIGHT = 48;
	const ITEM_PADDING_TOP = 8;
	const MenuProps = {
		PaperProps: {
			style: {
				maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
				width: 250,
			},
		},
	};
	const handleChange = (event) => {
		const {
			target: { value },
		} = event;
		setPersonName(typeof value === "string" ? value.split(",") : value);
	};

	function changeObject(place) {
		if (place.target.value === null) return;
		setPlacesSelected(place.target.value);
	}

	return (
		<DashboardCard title="Criar solicitação" background="#f2f2f2">
			<Grid
				container
				spacing={1}
				style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
			>
				{openModal ? (
					<ModalSolicitation
						action={handleOpenModal}
						openModal={openModal}
						initialObject={objCreateSolicitation}
					/>
				) : null}
				<FormControl sx={{ m: 1, minWidth: 120 }}>
					<InputLabel>Empresa</InputLabel>
					<Select
						value={companySelect}
						label="Age"
						onChange={(company) => handleCompany(company.target.value)}
					>
						{companies.length === 0 ? (
							<MenuItem value={null}>Cadastre uma empresa</MenuItem>
						) : (
							companies.map((company) => {
								return (
									<MenuItem translate="no" key={company.id} value={company.id}>
										{company.name}
									</MenuItem>
								);
							})
						)}
					</Select>
				</FormControl>
				<FormControl sx={{ m: 1, minWidth: 120 }}>
					<InputLabel>Ambientes</InputLabel>
					<Select
						value={placesSelected}
						onChange={(place) => changeObject(place)}
					>
						{places.length === 0 ? (
							<MenuItem value={null}>
								Selecione uma empresa ou Cadastre um ambiente
							</MenuItem>
						) : (
							places.map((place) => {
								return (
									<MenuItem key={place.id} value={place.id}>
										{place.name}
									</MenuItem>
								);
							})
						)}
					</Select>
				</FormControl>

				<FormControl sx={{ m: 1, minWidth: 120 }}>
					<InputLabel id="demo-multiple-chip-label">Objetos</InputLabel>
					<Select
						labelId="demo-multiple-chip-label"
						id="demo-multiple-chip"
						multiple
						value={personName}
						onChange={handleChange}
						input={<OutlinedInput id="select-multiple-chip" label="Chip" />}
						renderValue={(selected) => (
							<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
								{selected.map((value) => (
									<Chip key={value} label={value} />
								))}
							</Box>
						)}
						MenuProps={MenuProps}
					>
						{objects.length === 0 ? (
							<MenuItem value={null}>
								Selecione uma empresa ou Cadastre um objeto
							</MenuItem>
						) : (
							objects.map((name) => (
								<MenuItem key={name.id} value={name.name}>
									{name.name}
								</MenuItem>
							))
						)}
					</Select>
					{/* {objects.map((object) => {
                            return (
                                <MenuItem key={object.id} value={object}>{object.name}</MenuItem>
                            )
                        })} */}
				</FormControl>
				{users.length > 0 ? (
					<FormControl sx={{ m: 1, minWidth: 120 }}>
						<InputLabel>Operário</InputLabel>
						<Select
							value={userSelected}
							onChange={(user) => setUserSelected(user.target.value)}
						>
							{users.map((user) => {
								return (
									<MenuItem key={user.id} value={user.id}>
										{user.name}
									</MenuItem>
								);
							})}
						</Select>
					</FormControl>
				) : null}
				<FormControl sx={{ m: 1, minWidth: 120 }}>
					<FormControlLabel
						control={<Checkbox onChange={() => setRepeat(!repeat)} />}
						label="Recorrente"
					/>
				</FormControl>
				<FormControl sx={{ m: 1, minWidth: 120 }}>
					<Button
						onClick={handleNextPass}
						variant={
							objectSelect && placesSelected && userSelected && days.length > 0
								? "contained"
								: "outlined"
						}
						color="primary"
						style={{ height: 30 }}
					>
						{isLoading ? (
							<CircularProgress size={20} />
						) : (
							<>
								<span>Selecionar horários</span>
								<AlarmOnIcon />
							</>
						)}
					</Button>
				</FormControl>
			</Grid>
			<DayPicker
				locale={pt}
				mode="multiple"
				selected={days}
				disabled={{ before: today }}
				onSelect={setDays}
				styles={{
					table: {
						minWidth: "35vw",
					},
					day: {
						height: "90px",
						minWidth: "70%",
					},
					cell: {
						alignItems: "center",
						borderRadius: "4px",
						fontSize: cellHeight,
					},
				}}
			/>
		</DashboardCard>
	);
};

export default SalesOverview;

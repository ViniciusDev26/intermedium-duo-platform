import {
	Box,
	Button,
	CircularProgress,
	FormControl,
	InputLabel,
	MenuItem,
	Modal,
	OutlinedInput,
	Select,
	TextField,
	Typography,
} from "@mui/material";
import { useContext, useState } from "react";
import Api from "src/api/service";
import AuthContext from "src/contexto/AuthContext";
import Swal from "sweetalert2";

export default function ModalCrud({
	verb,
	action,
	openModal,
	companyId,
	companies,
	findCompanies,
}) {
	const [path, setPath] = useState("");
	const { user } = useContext(AuthContext);
	const [isLoading, setLoading] = useState(false);
	const [permissionions, setPermissionions] = useState([]);
	const [email, setEmail] = useState("");
	const [companiesId, setCompaniesId] = useState([]);
	const [role, setRole] = useState("");
	const [name, setName] = useState("");
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

	async function handleCreate() {
		if (path == "manager") {
			const companiesSend = companiesId.map((company) => {
				const { id } = companies.find((item) => item.name == company);
				return id;
			});

			const send = {
				name,
				email: email,
				companyId: companiesSend,
				role,
				permissions: permissionions,
			};
			handleCreateManager(send);
			return;
		}
		if (isLoading) return;
		setLoading(true);
		if (!name || !companyId) {
			await Swal.fire({
				icon: "warning",
				title: "Preencha todos os campos",
				showDenyButton: false,
				showCancelButton: false,
				showConfirmButton: true,
				denyButtonText: "Cancelar",
				confirmButtonText: "ok",
			});
			setLoading(false);
			return;
		}
		const send = {
			companyId,
			name: name,
		};
		if (path == "user") {
			send.password = "intermedium";
		}
		try {
			await Api.post(`${path}/create`, send);
			action();
			await Swal.fire({
				icon: "success",
				title: "Criação bem sucessedida",
				showDenyButton: true,
				showCancelButton: false,
				showConfirmButton: true,
				denyButtonText: "Cancelar",
				confirmButtonText: "Confirmar",
			});
		} catch (error) {
			await Swal.fire({
				icon: "error",
				title: "Erro ao efetuar criação",
				showDenyButton: true,
				showCancelButton: false,
				showConfirmButton: true,
				denyButtonText: "Cancelar",
				confirmButtonText: "Confirmar",
			});
		}
		setLoading(false);
	}
	async function handleCreateManager(send) {
		if (isLoading) return;
		setLoading(true);
		if (!name || !email || !role) {
			await Swal.fire({
				icon: "info",
				title: "Preencha todos os campos",
				showDenyButton: true,
				showCancelButton: false,
				showConfirmButton: true,
				denyButtonText: "Cancelar",
				confirmButtonText: "Confirmar",
			});
			setLoading(false);
			return;
		}
		try {
			await Api.post(`manager/create`, send);
			action();

			await Swal.fire({
				icon: "success",
				title: "Criação bem sucessedida",
				showDenyButton: true,
				showCancelButton: false,
				showConfirmButton: true,
				denyButtonText: "Cancelar",
				confirmButtonText: "Confirmar",
			});
		} catch (error) {
			await Swal.fire({
				icon: "error",
				title: "Erro ao criar gerente",
				showDenyButton: false,
				showCancelButton: false,
				showConfirmButton: true,
				denyButtonText: "Cancelar",
				confirmButtonText: "ok",
			});
		}
		setLoading(false);
	}
	const handleChange = (event) => {
		setPath(event.target.value);
	};
	const handleChangePermissions = (event) => {
		const {
			target: { value },
		} = event;
		setPermissionions(typeof value === "string" ? value.split(",") : value);
	};
	const handleChangeCompanies = (event) => {
		const {
			target: { value },
		} = event;
		setCompaniesId(typeof value === "string" ? value.split(",") : value);
	};
	const style = {
		position: "absolute",
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		bgcolor: "background.paper",
		p: 4,
		width: 400,
		outline: 0,
		borderRadius: 1,
		alignItems: "center",
		display: "flex",
		flexDirection: "column",
	};

	// place deletion
	const [itemsDeletion, setItemsDeletion] = useState([]);
	const [pathDelete, setPathDelete] = useState("");
	const [itemSelected, setItemSelected] = useState("");

	async function getAllObjects(route) {
		setPathDelete(route);
		setLoading(true);
		if (route === "companies") {
			setItemsDeletion(companies);
			setLoading(false);
			return;
		}
		try {
			const { data } = await Api.get(
				`/${route}/recover?companyId=${companyId}`,
			);
			setItemsDeletion(data);
		} catch (error) {
			await Swal.fire({
				icon: "error",
				title: "Erro ao recuperar items",
				showDenyButton: false,
				showCancelButton: false,
				showConfirmButton: true,
				denyButtonText: "Cancelar",
				confirmButtonText: "ok",
			});
		}
		setLoading(false);
	}

	async function deletionItem() {
		setLoading(true);
		action();
		const confirm = await Swal.fire({
			icon: "question",
			title: "Deseja realmente deleter esse item?",
			showDenyButton: true,
			showCancelButton: false,
			showConfirmButton: true,
			denyButtonText: "Cancelar",
			confirmButtonText: "Sim",
		});

		if (!confirm.isConfirmed) return;

		try {
			await Api.delete(
				`/${pathDelete}/delete?${pathDelete == "companies" ? "company" : pathDelete}Id=${itemSelected}`,
			);
			action();
			findCompanies();
			await Swal.fire({
				icon: "success",
				title: "Deleção bem sucedida",
				showDenyButton: false,
				showCancelButton: false,
				showConfirmButton: true,
				denyButtonText: "Cancelar",
				confirmButtonText: "ok",
			});
		} catch (error) {
			await Swal.fire({
				icon: "error",
				title: "Conflito ao deletar item",
				html: "<p>Item sendo usado em alguma solicitação vigente</p>",
				showDenyButton: false,
				showCancelButton: false,
				showConfirmButton: true,
				denyButtonText: "Cancelar",
				confirmButtonText: "ok",
			});
		}
		setLoading(false);
	}

	//place edition
	const [newName, setNewName] = useState("");
	async function edition() {
		try {
			await Api.post(`/${pathDelete}/update/`, {
				name: newName,
				id: itemSelected,
			});
			action();
			getAllObjects(pathDelete);
			findCompanies();
			await Swal.fire({
				icon: "success",
				title: "Edição concluída",
				showDenyButton: false,
				showCancelButton: false,
				showConfirmButton: true,
				denyButtonText: "Cancelar",
				confirmButtonText: "ok",
			});
			if (pathDelete === "companies") {
				findCompanies();
			}
		} catch (error) {
			action();
			await Swal.fire({
				icon: "error",
				title: "Erro ao editar item",
				showDenyButton: false,
				showCancelButton: false,
				showConfirmButton: true,
				denyButtonText: "Cancelar",
				confirmButtonText: "ok",
			});
		}
	}

	return (
		<Modal
			disableEnforceFocus
			open={openModal}
			aria-labelledby="modal-modal-title"
			aria-describedby="modal-modal-description"
			onClose={action}
		>
			<Box sx={style}>
				<Typography
					id="modal-modal-title"
					variant="h6"
					component="h2"
					style={{ marginBottom: 20 }}
				>
					CONFIGURAÇÃO
				</Typography>
				{verb == "Cadastrar" ? (
					<FormControl fullWidth>
						<FormControl>
							<InputLabel id="demo-simple-select-label">Cadastrar</InputLabel>
							<Select
								labelId="demo-simple-select-label"
								id="demo-simple-select"
								value={path}
								label="Age"
								onChange={handleChange}
								style={{ margin: 5 }}
							>
								<MenuItem value={"place"}>Ambiente</MenuItem>
								<MenuItem value={"objects"}>Objeto</MenuItem>
								<MenuItem value={"epis"}>EPI</MenuItem>
								<MenuItem value={"companies"}>Empresa</MenuItem>
								<MenuItem value={"user"}>Operador</MenuItem>
								{JSON.parse(user).role === "ADMIN" ? (
									<MenuItem value={"manager"}>Gerente</MenuItem>
								) : null}
							</Select>

							{path == "manager" ? (
								<FormControl fullWidth>
									<FormControl style={{ margin: 10 }}>
										<InputLabel id="demo-simple-select-label">
											Permissões
										</InputLabel>
										<Select
											multiple
											displayEmpty
											value={permissionions}
											onChange={handleChangePermissions}
											input={<OutlinedInput />}
											renderValue={(selected) => {
												if (selected.length === 0) {
													return <em>Permissões</em>;
												}

												return selected.join(", ");
											}}
											MenuProps={MenuProps}
											inputProps={{ "aria-label": "Without label" }}
										>
											<MenuItem disabled value="">
												<em>Permissões</em>
											</MenuItem>
											<MenuItem value={"OBJECTS"}>OBJECTS</MenuItem>
											<MenuItem value={"PLACES"}>Ambientes</MenuItem>
											<MenuItem value={"COMPANIES"}>Empresas</MenuItem>
											<MenuItem value={"EPIS"}>EPIs</MenuItem>
										</Select>
									</FormControl>
									<FormControl style={{ margin: 10 }}>
										<InputLabel id="demo-simple-select-label">
											Hierarquia
										</InputLabel>
										<Select
											labelId="demo-simple-select-label"
											id="demo-simple-select"
											value={role}
											label="Age"
											onChange={(e) => setRole(e.target.value)}
										>
											<MenuItem value={"MANAGER"}>Gerente</MenuItem>
											<MenuItem value={"ADMIN"}>Administrador</MenuItem>
										</Select>
									</FormControl>
									<FormControl style={{ margin: 10 }}>
										<InputLabel id="demo-simple-select-label">
											Empresas
										</InputLabel>
										<Select
											multiple
											displayEmpty
											value={companiesId}
											onChange={handleChangeCompanies}
											input={<OutlinedInput />}
											renderValue={(selected) => {
												if (selected.length === 0) {
													return <em>Empresas</em>;
												}

												return selected.join(", ");
											}}
											MenuProps={MenuProps}
											inputProps={{ "aria-label": "Without label" }}
										>
											<MenuItem disabled value="">
												<em>Empresas</em>
											</MenuItem>
											{companies.map((company) => {
												return (
													<MenuItem value={company.name} key={company.id}>
														{company.name}
													</MenuItem>
												);
											})}
										</Select>
									</FormControl>
									<TextField
										style={{ margin: 5 }}
										onChange={(event) => setEmail(event.target.value)}
										id="outlined-basic"
										label="Email"
										variant="outlined"
									/>
								</FormControl>
							) : null}
						</FormControl>

						<FormControl>
							<TextField
								style={{ margin: 5 }}
								onChange={(event) => setName(event.target.value)}
								id="outlined-basic"
								label="Nome"
								variant="outlined"
							/>

							<Button variant="contained" onClick={handleCreate}>
								{isLoading ? (
									<CircularProgress size={20} />
								) : (
									<span>Criar</span>
								)}
							</Button>
						</FormControl>
					</FormControl>
				) : verb == "Deletar" ? (
					<FormControl fullWidth>
						<InputLabel id="demo-simple-select-label">Deletar</InputLabel>
						<Select
							labelId="demo-simple-select-label"
							id="demo-simple-select"
							value={pathDelete}
							label="Age"
							onChange={(index) => getAllObjects(index.target.value)}
							style={{ margin: 5 }}
						>
							<MenuItem value={"place"}>Ambiente</MenuItem>
							<MenuItem value={"objects"}>Objeto</MenuItem>
							<MenuItem value={"epis"}>EPI</MenuItem>
							<MenuItem value={"companies"}>Empresa</MenuItem>
						</Select>
						<FormControl>
							<InputLabel id="demo-simple-select-label">Deletar</InputLabel>
							<Select
								labelId="demo-simple-select-label"
								id="demo-simple-select"
								label="Age"
								onChange={(e) => setItemSelected(e.target.value)}
								style={{ margin: 5 }}
							>
								{itemsDeletion.map((object) => {
									return <MenuItem value={object.id}>{object.name}</MenuItem>;
								})}
							</Select>

							<Button variant="contained" onClick={deletionItem}>
								{isLoading ? (
									<CircularProgress size={20} />
								) : (
									<span>Deletar</span>
								)}
							</Button>
						</FormControl>
					</FormControl>
				) : verb == "Editar" ? (
					<FormControl fullWidth>
						<InputLabel id="demo-simple-select-label">Editar</InputLabel>
						<Select
							labelId="demo-simple-select-label"
							id="demo-simple-select"
							value={pathDelete}
							label="Age"
							onChange={(index) => getAllObjects(index.target.value)}
							style={{ margin: 5 }}
						>
							<MenuItem value={"place"}>Ambiente</MenuItem>
							<MenuItem value={"objects"}>Objeto</MenuItem>
							<MenuItem value={"epis"}>EPI</MenuItem>
							<MenuItem value={"companies"}>Empresa</MenuItem>
							<MenuItem value={"user"}>Operador</MenuItem>
						</Select>
						<FormControl>
							<InputLabel id="demo-simple-select-label">Editar</InputLabel>
							<Select
								labelId="demo-simple-select-label"
								id="demo-simple-select"
								label="Age"
								onChange={(e) => setItemSelected(e.target.value)}
								style={{ margin: 5 }}
							>
								<MenuItem disabled value={null}>
									Selecione a categoria
								</MenuItem>
								{itemsDeletion.map((object) => {
									return <MenuItem value={object.id}>{object.name}</MenuItem>;
								})}
							</Select>
							<TextField
								style={{ margin: 5 }}
								onChange={(event) => setNewName(event.target.value)}
								id="outlined-basic"
								label="Novo nome"
								variant="outlined"
							/>

							<Button variant="contained" onClick={edition}>
								{isLoading ? (
									<CircularProgress size={20} />
								) : (
									<span>Editar</span>
								)}
							</Button>
						</FormControl>
					</FormControl>
				) : null}
			</Box>
		</Modal>
	);
}

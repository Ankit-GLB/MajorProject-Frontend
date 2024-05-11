import "./Navbar.scss";
import conversation from "./assets/conversation.png";

const Navbar = () => {
  return (
    <div className="navbar">
      <div id="navbar-form-div">
        <p>Vachan</p>
        <img id="conversation" src={conversation} />
      </div>
    </div>
  );
};

export default Navbar;

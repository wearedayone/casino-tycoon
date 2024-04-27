// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
// import '@openzeppelin/contracts/access/Ownable.sol';
import './libs/SafeMath.sol';
import './libs/SafeTransferLib.sol';
import './interfaces/IUniswapV2Factory.sol';
import './interfaces/IUniswapV2Pair.sol';
import './interfaces/IUniswapV2Router02.sol';
import './IGangsterArena.sol';

// import 'hardhat/console.sol';

contract GREED is ERC20, AccessControl, ERC20Burnable, ERC20Permit, ReentrancyGuard {
  using SafeMath for uint256;
  using SafeTransferLib for address payable;
  bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');

  IUniswapV2Router02 public uniswapV2Router;
  address public uniswapV2Pair;

  IGangsterArena public gangsterArena;
  address public _defaultAdmin;

  // swap everytime this contract hold more than 1k fiat
  uint256 public swapTokensAtAmount = 1000 * 1e18;

  uint256 public totalFees = 5_00; // 5%
  uint256 public prizeFee = 2_50; // 2.5%
  uint256 public liquidityFee = 1_00; // 1%
  uint256 public devFee = 1_50; // 1.5%
  uint256 public burnFee = 0; // 0%

  uint256 public tokensForRevShare = 0;
  uint256 public tokensForLiquidity = 0;
  uint256 public tokensForTeam = 0;
  uint256 public percentOfRankPrize = 60_00; //60%

  /******************/

  mapping(address => bool) private _isExcludedFromFees;

  event ExcludeFromFees(address indexed account, bool isExcluded);

  event SwapAndLiquify(uint256 tokensSwapped, uint256 ethReceived, uint256 tokensIntoLiquidity);

  constructor(address defaultAdmin, address minter) ERC20('GANG', '$GANG') ERC20Permit('GANG') {
    _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
    _grantRole(MINTER_ROLE, minter);
    _defaultAdmin = defaultAdmin;

    excludeFromFees(address(0), true);
    excludeFromFees(address(this), true);
    excludeFromFees(_defaultAdmin, true);
  }

  receive() external payable {}

  /**
  ***************************
  Public
  ***************************
   */

  function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
    _mint(to, amount);
  }

  function batchMint(address[] calldata receivers, uint256[] calldata amounts) public onlyRole(MINTER_ROLE) {
    require(receivers.length == amounts.length);
    for (uint32 i = 0; i < receivers.length; i++) {
      _mint(receivers[i], amounts[i]);
    }
  }

  /**
  ***************************
  Customization for the contract (ADMIN_ROLE)
  ***************************
   */

  function manualSwapBack() public onlyRole(DEFAULT_ADMIN_ROLE) {
    swapBack();
  }

  function updateUniswapAddresses(
    address _uniswapV2Pair,
    address _uniswapV2Router
  ) public onlyRole(DEFAULT_ADMIN_ROLE) {
    uniswapV2Pair = _uniswapV2Pair;
    uniswapV2Router = IUniswapV2Router02(_uniswapV2Router);
  }

  function updateGangsterArenaAddress(address _address) public onlyRole(DEFAULT_ADMIN_ROLE) {
    gangsterArena = IGangsterArena(_address);
  }

  function updateSwapTokensAtAmount(uint256 newAmount) public onlyRole(DEFAULT_ADMIN_ROLE) {
    swapTokensAtAmount = newAmount;
  }

  function updateFees(
    uint256 _prizeFee,
    uint256 _liquidityFee,
    uint256 _devFee,
    uint256 _burnFee,
    uint256 _percentOfRankPrize
  ) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_prizeFee + _liquidityFee + _devFee + _burnFee <= 10000, 'Fees must be <= 10000.');
    require(_percentOfRankPrize <= 10000, 'percen must be <= 10000.');
    prizeFee = _prizeFee;
    liquidityFee = _liquidityFee;
    devFee = _devFee;
    burnFee = _burnFee;
    totalFees = _prizeFee + _liquidityFee + _devFee + _burnFee;
    percentOfRankPrize = _percentOfRankPrize;
  }

  function excludeFromFees(address account, bool excluded) public onlyRole(DEFAULT_ADMIN_ROLE) {
    _isExcludedFromFees[account] = excluded;
    emit ExcludeFromFees(account, excluded);
  }

  function isExcludedFromFees(address account) public view returns (bool) {
    return _isExcludedFromFees[account];
  }

  function withdrawStuckToken() external onlyRole(DEFAULT_ADMIN_ROLE) {
    uint256 balance = IERC20(address(this)).balanceOf(address(this));
    IERC20(address(this)).transfer(msg.sender, balance);
    payable(msg.sender).transfer(address(this).balance);
  }

  function withdrawStuckEth(address toAddr) external onlyRole(DEFAULT_ADMIN_ROLE) {
    payable(toAddr).safeTransferETH(address(this).balance);
  }

  /**
  ***************************
  Private
  ***************************
   */

  function _update(address from, address to, uint256 amount) internal override {
    if (amount == 0) return;

    bool isBuy = from == uniswapV2Pair;
    bool isSell = to == uniswapV2Pair;

    // only take fees on buys/sells, do not take on wallet transfers
    bool takeFee = !_isExcludedFromFees[from] && !_isExcludedFromFees[to] && (isSell || isBuy);
    uint256 fees = 0;

    uint256 contractTokenBalance = balanceOf(address(this));

    bool canSwap = contractTokenBalance >= swapTokensAtAmount;

    if (canSwap && isSell && !_isExcludedFromFees[from] && !_isExcludedFromFees[to]) {
      swapBack();
    }
    if (takeFee) {
      fees = amount.mul(totalFees).div(10000);
      tokensForLiquidity += (fees * liquidityFee) / totalFees;
      tokensForTeam += (fees * devFee) / totalFees;
      tokensForRevShare += (fees * prizeFee) / totalFees;
      uint256 tokensForBurn = (fees * burnFee) / totalFees;

      if (fees > 0) {
        if (tokensForBurn > 0) super._update(from, address(0), tokensForBurn);
        super._update(from, address(this), fees - tokensForBurn);
      }

      amount -= fees;
    }

    super._update(from, to, amount);
  }

  function swapTokensForEth(uint256 tokenAmount) private {
    // generate the uniswap pair path of token -> weth
    address[] memory path = new address[](2);
    path[0] = address(this);
    path[1] = uniswapV2Router.WETH();

    _approve(address(this), address(uniswapV2Router), tokenAmount);

    // make the swap
    uniswapV2Router.swapExactTokensForETHSupportingFeeOnTransferTokens(
      tokenAmount,
      0, // accept any amount of ETH
      path,
      address(this),
      block.timestamp
    );
  }

  function addLiquidity(uint256 tokenAmount, uint256 ethAmount) private {
    // approve token transfer to cover all possible scenarios
    _approve(address(this), address(uniswapV2Router), tokenAmount);

    // add the liquidity
    uniswapV2Router.addLiquidityETH{value: ethAmount}(
      address(this),
      tokenAmount,
      0, // slippage is unavoidable
      0, // slippage is unavoidable
      _defaultAdmin,
      block.timestamp
    );
  }

  function swapBack() internal nonReentrant {
    uint256 contractBalance = balanceOf(address(this));
    uint256 totalTokensToSwap = tokensForLiquidity + tokensForRevShare + tokensForTeam;

    if (contractBalance == 0 || totalTokensToSwap == 0) {
      return;
    }

    uint256 liquidityTokens = (contractBalance * tokensForLiquidity) / totalTokensToSwap;
    uint256 amountToSwapForETH = contractBalance.sub(liquidityTokens);

    uint256 initialETHBalance = address(this).balance;

    swapTokensForEth(amountToSwapForETH);

    uint256 ethBalance = address(this).balance.sub(initialETHBalance);

    uint256 ethForTeam = ethBalance.mul(tokensForTeam).div(totalTokensToSwap);

    uint256 ethForLiquidity = ethBalance.mul(tokensForLiquidity).div(totalTokensToSwap);

    uint256 ethForRevShare = ethBalance - ethForTeam - ethForLiquidity;
    uint256 ethForRankPrize = (ethForRevShare * percentOfRankPrize) / 10000;

    if (liquidityTokens > 0 && ethForLiquidity > 0) {
      addLiquidity(liquidityTokens, ethForLiquidity);
      // console.log(liquidityTokens, ethForLiquidity);
      emit SwapAndLiquify(amountToSwapForETH, ethForLiquidity, tokensForLiquidity);
    }

    gangsterArena.addReward{value: ethForTeam + ethForRevShare}(
      ethForTeam,
      0,
      ethForRankPrize,
      ethForRevShare - ethForRankPrize
    );
    tokensForLiquidity = 0;
    tokensForRevShare = 0;
    tokensForTeam = 0;
  }
}
